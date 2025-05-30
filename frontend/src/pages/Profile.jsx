import { useEffect, useState } from 'react';
import '../styles/Profile.css';
import { getCurrentUser } from '../utils/apiCalls/auth';
import penIcon from '../assets/pen.png';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const userData = getCurrentUser();
    if (userData) {
      setUser(userData);
      setFullName(userData.name || '');
      setProfileImage(userData.profileImage || null);
    }
    setLoading(false);
  }, []);

  const handleSaveName = () => {
    const updatedUser = { ...user, name: fullName };
    setUser(updatedUser);
    setEditingName(false);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result; // base64 string
        setProfileImage(imageUrl);

        const updatedUser = { ...user, profileImage: imageUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      };
      reader.readAsDataURL(file);
    }
  };


  if (loading) {
    return <div className="profile-loading">Loading profile information...</div>;
  }

  if (!user) {
    return <div className="profile-error">You must be logged in to view this page.</div>;
  }

  const aboutText = `Hey there! This is your space to manage your profile and stay on top of your tasks. Keep growing, stay focused, and make the most of every opportunity.`;

  let joinedDate = null;
  if (user.created_at) {
    joinedDate = new Date(user.created_at).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          {profileImage ? (
            <img
              key={profileImage} // forces re-render when image changes
              src={profileImage}
              alt="Profile"
              className="profile-avatar-image"
            />
          ) : (
            <div className="profile-avatar">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}


          <input
            id="profile-pic-upload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />

          <img
            src={penIcon}
            alt="Edit Profile"
            className="edit-image-icon"
            onClick={() => document.getElementById('profile-pic-upload').click()}
          />

        </div>

        <h1>{user.name}</h1>
        <p className="profile-email">{user.email}</p>
        {joinedDate && (
          <div className="profile-joined">Joined: {joinedDate}</div>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>About</h2>
          <div className="profile-about-card">
            {aboutText}
          </div>
        </div>
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="profile-info-card">
            <div className="profile-info-item">
              <span className="profile-info-label">Full Name</span>
              {editingName ? (
                <>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="profile-input"
                  />
                  <button onClick={handleSaveName}>Save</button>
                  <button onClick={() => { setFullName(user.name); setEditingName(false); }}>Cancel</button>
                </>
              ) : (
                <span className="profile-info-value">
                  {user.name}
                  <button
                    className="edit-icon-button"
                    onClick={() => setEditingName(true)}
                    aria-label="Edit Full Name"
                  >
                    <img src={penIcon} alt="Edit" className="edit-icon" />
                  </button>
                </span>
              )}
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Email Address</span>
              <span className="profile-info-value">{user.email}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">User ID</span>
              <span className="profile-info-value">{user.id}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Role</span>
              <span className="profile-info-value">{user.role || 'Regular User'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
