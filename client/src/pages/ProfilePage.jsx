import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { clearTokens, userApi } from "../utils/api";

const PROFILE_FIELDS = [
  {
    key: "displayName",
    label: "Display name",
    type: "text",
    autoComplete: "name",
  },
  {
    key: "username",
    label: "Username",
    type: "text",
    autoComplete: "username",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
  },
  {
    key: "role",
    label: "Role",
    type: "text",
    autoComplete: "organization-title",
  },
];

function getInitialProfile(user) {
  return {
    displayName: user?.displayName || "",
    username: user?.username || "",
    email: user?.email || "",
    role: user?.role || "",
    avatarUrl: user?.avatarUrl || "",
  };
}

function hasProfileChanges(profileForm, user) {
  if (!user || !profileForm) return false;
  const initialProfile = getInitialProfile(user);

  return (
    profileForm.displayName !== initialProfile.displayName ||
    profileForm.username !== initialProfile.username ||
    profileForm.email !== initialProfile.email ||
    profileForm.role !== initialProfile.role ||
    profileForm.avatarUrl !== initialProfile.avatarUrl
  );
}

function formatJoinDate(value) {
  if (!value) return "New member";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "New member";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

export default function ProfilePage({
  user,
  profileForm,
  setProfileForm,
  searchQuery = "",
}) {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const { setUser } = useAuth();
  const fileInputRef = React.useRef(null);

  const [viewedProfile, setViewedProfile] = React.useState(null);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileError, setProfileError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const editingOwnProfile = Boolean(user && (!profileId || profileId === user.id));
  const activeProfile = editingOwnProfile ? user : viewedProfile;
  const currentProfileForm = editingOwnProfile
    ? profileForm || getInitialProfile(user)
    : getInitialProfile(activeProfile);
  const dirty = editingOwnProfile
    ? hasProfileChanges(currentProfileForm, user)
    : false;
  const displayName =
    currentProfileForm.displayName ||
    activeProfile?.displayName ||
    activeProfile?.username ||
    "Member";
  const username =
    currentProfileForm.username || activeProfile?.username || "member";
  const joinedAt = React.useMemo(
    () => formatJoinDate(activeProfile?.createdAt),
    [activeProfile?.createdAt],
  );
  const accountStatus = activeProfile?.online
    ? "Active now"
    : editingOwnProfile
      ? "Signed in"
      : "Member profile";
  const sessionStatus = activeProfile?.online
    ? "Online"
    : editingOwnProfile
      ? "Current session"
      : "Offline";
  const profileSearch = searchQuery.trim().toLowerCase();

  React.useEffect(() => {
    let mounted = true;

    if (!profileId || profileId === user?.id) {
      setViewedProfile(null);
      setProfileError("");
      setProfileLoading(false);
      return () => {
        mounted = false;
      };
    }

    setProfileLoading(true);
    setProfileError("");

    userApi.get(profileId)
      .then((profile) => {
        if (mounted) setViewedProfile(profile);
      })
      .catch((err) => {
        if (!mounted) return;
        setViewedProfile(null);
        setProfileError(err.message || "Profile not found.");
      })
      .finally(() => {
        if (mounted) setProfileLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [profileId, user?.id]);

  const visibleFields = React.useMemo(() => {
    if (!profileSearch) return PROFILE_FIELDS;

    return PROFILE_FIELDS.filter((field) => {
      const value = currentProfileForm[field.key] || "";
      return `${field.label} ${field.key} ${value}`
        .toLowerCase()
        .includes(profileSearch);
    });
  }, [currentProfileForm, profileSearch]);

  const updateProfileField = (key) => (event) => {
    setMessage("");
    setError("");

    setProfileForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const handleReset = () => {
    setProfileForm(getInitialProfile(user));
    setMessage("");
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!editingOwnProfile || saving || !dirty) {
      return;
    }

    const nextProfile = {
      displayName: currentProfileForm.displayName.trim(),
      username: currentProfileForm.username.trim(),
      email: currentProfileForm.email.trim(),
      role: currentProfileForm.role.trim(),
      avatarUrl: currentProfileForm.avatarUrl || "",
    };

    if (
      !nextProfile.displayName ||
      !nextProfile.username ||
      !nextProfile.email ||
      !nextProfile.role
    ) {
      setMessage("");
      setError("Display name, username, email, and role are required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updatedUser = await userApi.updateMe(nextProfile);

      setUser(updatedUser);
      setProfileForm(getInitialProfile(updatedUser));

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your account? This cannot be undone.")) {
      return;
    }

    try {
      await userApi.deleteMe();

      clearTokens();
      setUser(null);

      navigate("/");
    } catch (err) {
      setMessage("");
      setError(err.message || "Unable to delete account.");
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("");
      setError("Choose an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    try {
      const avatarUrl = await readFileAsDataUrl(file);

      setMessage("");
      setError("");
      setProfileForm((current) => ({
        ...current,
        avatarUrl,
      }));
    } catch (err) {
      setError("Unable to read image file.");
    }

    event.target.value = "";
  };

  if (!editingOwnProfile && profileLoading) {
    return (
      <section className={`profile-page${user ? "" : " public-profile-page"}`}>
        <div className="status-empty">
          <span className="mini-spinner"></span>
        </div>
      </section>
    );
  }

  if (!editingOwnProfile && (!activeProfile || profileError)) {
    return (
      <section className={`profile-page${user ? "" : " public-profile-page"}`}>
        <div className="status-empty">
          <p>{profileError || "Profile not found."}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`profile-page${user ? "" : " public-profile-page"}`}>
      <header className="profile-hero">
        <div
          className="profile-hero-avatar"
          style={{ background: activeProfile?.color || "#444" }}
        >
          <Avatar
            avatarUrl={currentProfileForm.avatarUrl}
            name={displayName}
            className="avatar-image"
          />
        </div>

        <div className="profile-hero-copy">
          <span>Profile</span>
          <h1>{displayName}</h1>
          <p>@{username}</p>
          <div className="profile-pill-row">
            <span className="profile-pill">{accountStatus}</span>
            <span className="profile-pill soft">
              {currentProfileForm.role || "Member"}
            </span>
          </div>
        </div>
      </header>

      <div className="profile-content">
        <aside className="profile-preview-panel">
          <div
            className="profile-preview-avatar"
            style={{ background: activeProfile?.color || "#444" }}
          >
            <Avatar
              avatarUrl={currentProfileForm.avatarUrl}
              name={displayName}
              className="avatar-image"
            />
          </div>

          {editingOwnProfile ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />

              <button
                className="profile-upload-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload image
              </button>
            </>
          ) : null}

          <dl className="profile-meta-list">
            {editingOwnProfile ? (
              <div>
                <dt>Email</dt>
                <dd>{currentProfileForm.email || "Not set"}</dd>
              </div>
            ) : (
              <div>
                <dt>Username</dt>
                <dd>@{username}</dd>
              </div>
            )}
            <div>
              <dt>Member since</dt>
              <dd>{joinedAt}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{sessionStatus}</dd>
            </div>
          </dl>
        </aside>

        {editingOwnProfile ? (
          <form className="profile-form-panel" onSubmit={handleSave}>
            <div className="profile-section-head">
              <div>
                <h2>Account details</h2>
                <p>{dirty ? "Unsaved changes" : "All changes saved"}</p>
              </div>
            </div>

            {visibleFields.length === 0 ? (
              <div className="status-empty">
                <p>No profile settings match your search.</p>
              </div>
            ) : (
              <div className="profile-fields">
                {visibleFields.map((field) => (
                  <label className="profile-field" key={field.key}>
                    <span>{field.label}</span>
                    <input
                      type={field.type}
                      value={currentProfileForm[field.key]}
                      autoComplete={field.autoComplete}
                      onChange={updateProfileField(field.key)}
                      required
                    />
                  </label>
                ))}
              </div>
            )}

            {message ? (
              <div className="profile-message success">{message}</div>
            ) : null}

            {error ? <div className="profile-message error">{error}</div> : null}

            <div className="profile-actions">
              <button
                className="profile-secondary-btn"
                type="button"
                disabled={!dirty || saving}
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                className="profile-save-btn"
                type="submit"
                disabled={!dirty || saving}
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        ) : (
          <section className="profile-form-panel">
            <div className="profile-section-head">
              <div>
                <h2>Profile details</h2>
                <p>{currentProfileForm.role || "Member"}</p>
              </div>
            </div>

            <dl className="profile-meta-list profile-detail-list">
              <div>
                <dt>Display name</dt>
                <dd>{displayName}</dd>
              </div>
              <div>
                <dt>Username</dt>
                <dd>@{username}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{currentProfileForm.role || "Member"}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>

      {editingOwnProfile ? (
        <section className="profile-danger">
          <div>
            <h2>Account</h2>
            <p>Deleting removes your user from chat.</p>
          </div>
          <button
            className="profile-delete-btn"
            type="button"
            onClick={handleDelete}
          >
            Delete user
          </button>
        </section>
      ) : null}
    </section>
  );
}
