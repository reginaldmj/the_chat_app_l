import React from "react";
import { useNavigate } from "react-router-dom";
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
  if (!user) return false;
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
  const { setUser } = useAuth();

  const fileInputRef = React.useRef(null);

  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const dirty = hasProfileChanges(profileForm, user);
  const displayName =
    profileForm.displayName || user?.displayName || user?.username || "Member";
  const username = profileForm.username || user?.username || "member";
  const joinedAt = React.useMemo(() => formatJoinDate(user?.createdAt), [user]);
  const accountStatus = user?.online ? "Active now" : "Signed in";
  const sessionStatus = user?.online ? "Online" : "Current session";
  const profileSearch = searchQuery.trim().toLowerCase();

  const visibleFields = React.useMemo(() => {
    if (!profileSearch) return PROFILE_FIELDS;

    return PROFILE_FIELDS.filter((field) => {
      const value = profileForm[field.key] || "";
      return `${field.label} ${field.key} ${value}`
        .toLowerCase()
        .includes(profileSearch);
    });
  }, [profileForm, profileSearch]);

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

    if (!user || saving || !dirty) {
      return;
    }

    const nextProfile = {
      displayName: profileForm.displayName.trim(),
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
      role: profileForm.role.trim(),
      avatarUrl: profileForm.avatarUrl || "",
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

  return (
    <section className="profile-page">
      <header className="profile-hero">
        <div
          className="profile-hero-avatar"
          style={{ background: user.color || "#444" }}
        >
          <Avatar
            avatarUrl={profileForm.avatarUrl}
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
              {profileForm.role || "Member"}
            </span>
          </div>
        </div>
      </header>

      <div className="profile-content">
        <aside className="profile-preview-panel">
          <div
            className="profile-preview-avatar"
            style={{ background: user.color || "#444" }}
          >
            <Avatar
              avatarUrl={profileForm.avatarUrl}
              name={displayName}
              className="avatar-image"
            />
          </div>

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

          <dl className="profile-meta-list">
            <div>
              <dt>Email</dt>
              <dd>{profileForm.email || "Not set"}</dd>
            </div>
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
                    value={profileForm[field.key]}
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
      </div>

      <section className="profile-danger">
        <div>
          <h2>Account</h2>
          <p>Deleting removes your user from this workspace.</p>
        </div>
        <button
          className="profile-delete-btn"
          type="button"
          onClick={handleDelete}
        >
          Delete user
        </button>
      </section>
    </section>
  );
}
