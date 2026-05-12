import React from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { clearTokens, userApi } from "../utils/api";

function hasProfileChanges(profileForm, user) {
  if (!user) return false;

  return (
    profileForm.displayName !== (user.displayName || "") ||
    profileForm.username !== (user.username || "") ||
    profileForm.email !== (user.email || "") ||
    profileForm.role !== (user.role || "") ||
    profileForm.avatarUrl !== (user.avatarUrl || "")
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

export default function ProfilePage({ user, profileForm, setProfileForm }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const fileInputRef = React.useRef(null);

  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const handleSave = async (event) => {
    event.preventDefault();

    if (!user || saving || !hasProfileChanges(profileForm, user)) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updatedUser = await userApi.updateMe(profileForm);

      setUser(updatedUser);

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your account?")) {
      return;
    }

    await userApi.deleteMe();

    clearTokens();
    setUser(null);

    navigate("/");
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const avatarUrl = await readFileAsDataUrl(file);

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
      <h1>{profileForm.displayName || profileForm.username}</h1>

      <div
        className="profile-avatar"
        style={{ background: user.color || "#444" }}
      >
        <Avatar
          avatarUrl={profileForm.avatarUrl}
          name={profileForm.displayName || profileForm.username}
          className="avatar-image"
        />
      </div>

      <form className="profile-form" onSubmit={handleSave}>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Upload image
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />

        <label>
          Display name
          <input
            value={profileForm.displayName}
            onChange={(event) =>
              setProfileForm((current) => ({
                ...current,
                displayName: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Username
          <input
            value={profileForm.username}
            onChange={(event) =>
              setProfileForm((current) => ({
                ...current,
                username: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={profileForm.email}
            onChange={(event) =>
              setProfileForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Role
          <input
            value={profileForm.role}
            onChange={(event) =>
              setProfileForm((current) => ({
                ...current,
                role: event.target.value,
              }))
            }
          />
        </label>

        {message ? (
          <div className="profile-message success">{message}</div>
        ) : null}

        {error ? <div className="profile-message error">{error}</div> : null}

        <button
          className="profile-save-btn"
          type="submit"
          disabled={!hasProfileChanges(profileForm, user) || saving}
        >
          {saving ? "Saving..." : "Save profile"}
        </button>

        <button
          className="profile-delete-btn"
          type="button"
          onClick={handleDelete}
        >
          Delete user
        </button>
      </form>
    </section>
  );
}
