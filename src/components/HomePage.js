import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { FaBell, FaSignOutAlt, FaUser, FaCog, FaTasks } from "react-icons/fa";
import { signOut, onAuthStateChanged } from "firebase/auth";
import ManageRequestsPage from "./ManageRequestsPage";
import Settingspage from "./SettingsPage";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [userData, setUserData] = useState({ email: "Not available", name: "Not available" });
  const [viewMode, setViewMode] = useState("personal-info"); // personal-info, manage-requests, settings
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Check authentication status, user type, and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userQuery = query(
            collection(db, "users"),
            where("uid", "==", user.uid)
          );
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userDataFromFirestore = userDoc.data();
            if (userDataFromFirestore.type.trim() === "admin") {
              setUserData({
                email: userDataFromFirestore.email || "Not available",
                name: userDataFromFirestore.name || "Not available",
              });
              setLoading(false);
            } else {
              navigate("/login", { replace: true });
            }
          } else {
            console.log("No matching user document found");
            navigate("/login", { replace: true });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          navigate("/login", { replace: true });
        }
      } else {
        navigate("/login", { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch notifications
  useEffect(() => {
    if (!loading && auth.currentUser) {
      const fetchNotifications = async () => {
        try {
          const allNotifications = [];
          const mainNotificationsQuery = query(
            collection(db, "notifications"),
            orderBy("createdAt", "desc")
          );
          const mainNotificationsSnapshot = await getDocs(mainNotificationsQuery);
          const mainNotificationsList = mainNotificationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          allNotifications.push(...mainNotificationsList);

          const userQuery = query(
            collection(db, "users"),
            where("uid", "==", auth.currentUser.uid)
          );
          const userSnapshot = await getDocs(userQuery);
          if (!userSnapshot.empty) {
            const userDocId = userSnapshot.docs[0].id;
            const userNotificationsQuery = query(
              collection(db, `users/${userDocId}/notifications`),
              orderBy("createdAt", "desc")
            );
            const userNotificationsSnapshot = await getDocs(userNotificationsQuery);
            const userNotificationsList = userNotificationsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            allNotifications.push(...userNotificationsList);
          }

          allNotifications.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
          setNotifications(allNotifications);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };

      fetchNotifications();
    }
  }, [loading, auth.currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Header */}
      {/* <header className="home-header">
        <div className="header-left">
          <h1>Admin</h1>
        </div>
        <div className="header-right">
          <div className="notification-wrapper">
          </div>
          <button className="btn btn-logout" style={{display:"flex", background: "#ff4d4f"}}  onClick={handleLogout}>
            <FaSignOutAlt style={{display:'inline'}}/> 
            Logout
          </button>
        </div>
      </header> */}

      {/* Sidebar */}
      <div className="sidebare-container">
        <div style={{height:'65px',padding:'20px',fontWeight:'bold', display:'flex', justifyContent:'center', fontSize:20}}>
          Admin
        </div>
        <nav className="sidebar">
          <button style={{flexDirection:'row'}}
            className={`sidebar-btn ${viewMode === "personal-info" ? "active" : ""}`}
            onClick={() => setViewMode("personal-info")}
          >
            <FaUser /> Personal Information
          </button>
          <button style={{flexDirection:'row'}}
            className={`sidebar-btn ${viewMode === "manage-requests" ? "active" : ""}`}
            onClick={() => setViewMode("manage-requests")}
          >
            <FaTasks /> Manage Requests
          </button>
          <button style={{flexDirection:'row'}}
            className={`sidebar-btn ${viewMode === "settings" ? "active" : ""}`}
            onClick={() => setViewMode("settings")}
          >
            <FaCog /> Settings
          </button>

          <div className="logout-container" display={{flex:1}}>
            <button className="btn btn-logout" style={{display:"flex", background: "#ff4d4f", flexDirection:'row'}}  onClick={handleLogout}>
                Logout
                <FaSignOutAlt style={{display:'inline'}}/> 
            </button>
          </div>
        </nav>
      </div>
      {/* Main Content */}
      <main className="content" style={{direction:'ltr'}}>
        {viewMode === "personal-info" && (
          <div className="details-section ">
            <h2>Personal Information</h2>
            <div className="details-card" >
              <div className="form-group" >
                <label>Email</label>
                <input
                  type="email"
                  value={userData.email}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={userData.name}
                  disabled
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === "manage-requests" && (
          <div className="manage-requests-section">
            <h2>Manage Requests</h2>
            <ManageRequestsPage />
          </div>
        )}

        {viewMode === "settings" && (
          <div className="settings-section">
            <h2>Settings</h2>
            <Settingspage />
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;