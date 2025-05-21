import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, getDoc, query, orderBy, doc, setDoc, where, deleteDoc, updateDoc } from "firebase/firestore";
import { FaBell, FaSignOutAlt, FaList, FaCheckCircle } from "react-icons/fa";
import { signOut, onAuthStateChanged } from "firebase/auth";
import "./HomePage.css";

const Home3Page = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [subscribedActivities, setSubscribedActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [activityTypes, setActivityTypes] = useState([]);
  const [viewMode, setViewMode] = useState("activities"); // activities, subscribed, details, register
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedActivityDetails, setSelectedActivityDetails] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [registrationFileLink, setRegistrationFileLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Placeholder image URL for activities without an image
  const placeholderImage = "https://via.placeholder.com/300x150?text=No+Image";

  // Check authentication status and user type
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
            if (userDoc.exists() && userDoc.data().type === "user") {
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

  // Fetch notifications from user's notifications subcollection
  useEffect(() => {
    if (!loading && auth.currentUser) {
      const fetchNotifications = async () => {
        try {
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
              docRef: doc.ref,
              ...doc.data(),
            }));
            setNotifications(userNotificationsList);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      };

      fetchNotifications();
    }
  }, [loading, auth.currentUser]);

  // Fetch activities and subscribed activities
  useEffect(() => {
    if (!loading && auth.currentUser) {
      const fetchActivities = async () => {
        try {
          const q = query(collection(db, "Activities"));
          const querySnapshot = await getDocs(q);
          const activitiesList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setActivities(activitiesList);
          setFilteredActivities(activitiesList);

          const types = [...new Set(activitiesList.map((activity) => activity.type).filter((type) => type))];
          setActivityTypes(types);
        } catch (error) {
          console.error("Error fetching activities:", error);
        }
      };

      const fetchSubscribedActivities = async () => {
        try {
          const currentUserId = auth.currentUser.uid;
          const userQuery = query(collection(db, "users"), where("uid", "==", currentUserId));
          const userSnapshot = await getDocs(userQuery);

          if (userSnapshot.empty) {
            console.warn("User not found in database.");
            return;
          }

          const userDoc = userSnapshot.docs[0];
          const userDocId = userDoc.id;
          const userEnterQuery = collection(db, `users/${userDocId}/enter`);
          const userEnterSnapshot = await getDocs(userEnterQuery);

          const userEnterList = userEnterSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const activitiesList = [];

          for (const entry of userEnterList) {
            const activityId = entry.activityId;
          
            const activityDocRef = doc(db, "Activities", activityId);
            const activityDoc = await getDoc(activityDocRef);
          
            if (activityDoc.exists()) {
              const activityData = activityDoc.data();
          
              const activityEnterDocRef = doc(db, `Activities/${activityId}/enter/${currentUserId}`);
              const activityEnterDoc = await getDoc(activityEnterDocRef);
          
              if (activityEnterDoc.exists()) {
                const enterData = activityEnterDoc.data();
                const groupSchedule = activityData.groupSchedules?.[enterData.groupNumber] || null;
                activitiesList.push({
                  activityId,
                  activityName: activityData.activityName,
                  activityImage: activityData.activityImage, // Include activityImage
                  details: {
                    ...enterData,
                    groupSchedule,
                  },
                });
              }
            } else {
              console.log("Activity document not found for ID:", activityId);
            }
          }
          
          setSubscribedActivities(activitiesList);
        } catch (error) {
          console.error("Error fetching subscribed activities:", error);
        }
      };

      fetchActivities();
      fetchSubscribedActivities();
    }
  }, [loading, auth.currentUser]);

  // Filter activities
  useEffect(() => {
    let filtered = activities;
    if (searchQuery) {
      filtered = filtered.filter((activity) =>
        activity.activityName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedType) {
      filtered = filtered.filter((activity) => activity.type === selectedType);
    }
    setFilteredActivities(filtered);
  }, [searchQuery, selectedType, activities]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    try {
      if (!phone.match(/^\d{10,15}$/)) {
        alert("Please enter a valid phone number (10-15 digits)");
        return;
      }
      if (!registrationFileLink.startsWith("https://drive.google.com/")) {
        alert("Please enter a valid Google Drive link!");
        return;
      }

      const requestData = {
        firstName,
        lastName,
        dateOfBirth,
        placeOfBirth,
        phone,
        registrationFileLink,
        createdAt: new Date(),
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
      };

      // Store registration request
      const requestDocRef = doc(collection(db, `Activities/${selectedActivity.id}/domande`));
      await setDoc(requestDocRef, requestData);

      // Store notification in the activity's notifications subcollection
      await setDoc(doc(collection(db, `Activities/${selectedActivity.id}/notifications`)), {
        message: `New registration request from ${firstName} ${lastName} for activity ${selectedActivity.activityName}`,
        createdAt: new Date(),
        isRead: false,
      });

      alert("Registration request sent successfully!");
      setViewMode("activities");
      setFirstName("");
      setLastName("");
      setDateOfBirth("");
      setPlaceOfBirth("");
      setPhone("");
      setRegistrationFileLink("");
    } catch (error) {
      console.error("Error sending registration request:", error);
      alert("Failed to send registration request: " + error.message);
    }
  };

  const handleUnsubscribe = async (activityId) => {
    try {
      const userId = auth.currentUser.uid;
      await deleteDoc(doc(db, `Activities/${activityId}/enter`, userId));
      await deleteDoc(doc(db, `users/${userId}/enter`, activityId));
      setSubscribedActivities(subscribedActivities.filter((activity) => activity.activityId !== activityId));
      alert("Unsubscribed successfully!");
    } catch (error) {
      console.error("Error unsubscribing:", error);
      alert("Failed to unsubscribe: " + error.message);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await updateDoc(notification.docRef, { isRead: true });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
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
    <div className="home-container ltr text-left">
      {/* Header */}
      {/* <header className="home-header">
      <div className="notification-wrapper" style={{ position: "relative" }}>
            <FaBell
              size={24}
              onClick={() => setShowNotifications(!showNotifications)}
            />
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="notification-badge">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
            {showNotifications && (
              <div
                className="notification-panel"
                style={{
                  position: "absolute",
                  top: "40px",
                  right: "0",
                  width: "300px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                }}
              >
                <h3>Notifications</h3>
                {notifications.length === 0 ? (
                  <p>No notifications</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="notification-item"
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        backgroundColor: notification.isRead ? "#f9f9f9" : "#e6f3ff",
                        cursor: "pointer",
                        padding: "10px",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <p>{notification.message}</p>
                      <small>
                        {notification.createdAt?.toDate().toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        <div className="header-left">
          <h1>Activities</h1>
        </div>
        
      </header> */}

      {/* Sidebar */}
      <div className="fixed w-[300px] bg-white left-0 h-[100vh] top-0">
        <div className="text-2xl font-bold p-4 text-center">
          User
        </div>
        <nav className="sidebar">
          <button
            style={{flexDirection:'row'}}
            className={`sidebar-btn ${viewMode === "activities" ? "active" : ""}`}
            onClick={() => setViewMode("activities")}
          >
            <FaList /> Activities
          </button>
          <button
            style={{flexDirection:'row'}}
            className={`sidebar-btn ${viewMode === "subscribed" ? "active" : ""}`}
            onClick={() => setViewMode("subscribed")}
          >
            <FaCheckCircle /> Subscribed Activities
          </button>
          <div className="flex-1 justify-center flex items-end pb-10">
          
            <button className="w-full flex justify-center gap-2 rounded-3xl bg-red-500 text-white p-3 items-center hover:bg-red-600 " onClick={handleLogout}>
            Logout   <FaSignOutAlt /> 
          </button>
        </div>
        </nav>
      </div>
      {/* Main Content */}
      <main className="content">
        {viewMode === "activities" && (
          <div className="activities-section">
            <div className="section-header flex justify-between flex-row items-center">
              <h2>Activities List</h2>
              <div className="controls">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for an activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="type-select"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {activityTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="activities-list">
              {filteredActivities.length === 0 ? (
                <p className="no-data">No activities available</p>
              ) : (
                filteredActivities.map((activity) => (
                  <div key={activity.id} className="activity-card">
                    {activity.activityImage ? (
                      <img
                        src={activity.activityImage}
                        alt={activity.activityName}
                        className="activity-image"
                      />
                    ) : (
                      <img
                        src={placeholderImage}
                        alt="No Image"
                        className="activity-image"
                      />
                    )}
                    <h3>{activity.activityName}</h3>
                    <p>Organization: {activity.organizationName}</p>
                    <div className="card-actions">
                      <button
                        className="btn btn-details"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setViewMode("details");
                        }}
                      >
                        View Details
                      </button>
                      <button
                        className="btn btn-register"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setViewMode("register");
                        }}
                      >
                        Register
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {viewMode === "subscribed" && (
          <div className="subscribed-section text-left ltr" style={{direction:'ltr'}}>
            <div className="section-header">
              <h2 className="text-left">Subscribed Activities</h2>
            </div>
            <div className="activities-list ">
              {subscribedActivities.length === 0 ? (
                <p className="no-data">You haven't subscribed to any activities yet</p>
              ) : (
                subscribedActivities.map((activity) => (
                  <div key={activity.activityId} className="bg-white  p-3 rounded-xl min-w-full">
                    {activity.activityImage ? (
                      <img
                        src={activity.activityImage}
                        alt={activity.activityName}
                        className="activity-image"
                      />
                    ) : (
                      <img
                        src={placeholderImage}
                        alt="No Image"
                        className="activity-image"
                      />
                    )}
                    <h3>{activity.activityName}</h3>
                    <div className="card-actions">
                      <button
                        className="btn btn-details"
                        onClick={() => {
                          setSelectedActivityDetails(activity.details);
                          setViewMode("subscribedDetails");
                        }}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-unsubscribe"
                        onClick={() => handleUnsubscribe(activity.activityId)}
                      >
                        Unsubscribe
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {viewMode === "details" && selectedActivity && (
          <div className="details-section">
            <button
              className="btn btn-back"
              onClick={() => setViewMode("activities")}
            >
              Back
            </button>
            <h2>Activity Details</h2>
            <div className="details-card">
              {selectedActivity.activityImage && (
                <img
                  src={selectedActivity.activityImage}
                  alt={selectedActivity.activityName}
                  className="activity-image"
                />
              )}
              <p>
                <strong>Activity Name:</strong> {selectedActivity.activityName}
              </p>
              <p>
                <strong>Organization Name:</strong>{" "}
                {selectedActivity.organizationName}
              </p>
              <p>
                <strong>Phone Number:</strong> {selectedActivity.phoneNumber}
              </p>
              <p>
                <strong>Email:</strong> {selectedActivity.email}
              </p>
            </div>
          </div>
        )}

        {viewMode === "subscribedDetails" && selectedActivityDetails && (
          <div className="details-section">
            <button
              className="btn btn-back"
              onClick={() => setViewMode("subscribed")}
            >
              Back
            </button>
            <h2>Subscription Details</h2>
            <div className="details-card">
              <p>
                <strong>First Name:</strong> {selectedActivityDetails.firstName}
              </p>
              <p>
                <strong>Last Name:</strong> {selectedActivityDetails.lastName}
              </p>
              <p>
                <strong>Date of Birth:</strong> {selectedActivityDetails.dateOfBirth}
              </p>
              <p>
                <strong>Place of Birth:</strong> {selectedActivityDetails.placeOfBirth}
              </p>
              <p>
                <strong>Phone Number:</strong> {selectedActivityDetails.phone}
              </p>
              <p>
                <strong>Email:</strong> {selectedActivityDetails.userEmail}
              </p>
              <p>
                <strong>Registration File Link:</strong>{" "}
                <a
                  href={selectedActivityDetails.registrationFileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View File
                </a>
              </p>
              <p>
                <strong>Subscription Start Date:</strong>{" "}
                {selectedActivityDetails.subscriptionDays?.start
                  ? selectedActivityDetails.subscriptionDays.start.toDate().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not set"}
              </p>
              <p>
                <strong>Subscription End Date:</strong>{" "}
                {selectedActivityDetails.subscriptionDays?.end
                  ? selectedActivityDetails.subscriptionDays.end.toDate().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not set"}
              </p>
              <p>
                <strong>Subscription Hours:</strong>{" "}
                {selectedActivityDetails.subscriptionHours?.start && selectedActivityDetails.subscriptionHours?.end
                  ? `${selectedActivityDetails.subscriptionHours.start} - ${selectedActivityDetails.subscriptionHours.end}`
                  : "Not set"}
              </p>
              <p>
                <strong>Group Number:</strong> {selectedActivityDetails.groupNumber || "Not assigned"}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {selectedActivityDetails.createdAt
                  ? selectedActivityDetails.createdAt.toDate().toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Not set"}
              </p>
              <p>
                <strong>Group Schedule:</strong>{" "}
                {selectedActivityDetails.groupSchedule ? (
                  <div>
                    <strong>Days:</strong> {selectedActivityDetails.groupSchedule.days.join(", ")}
                    <br />
                    <strong>Time Ranges:</strong>
                    <ul>
                      {selectedActivityDetails.groupSchedule.timeRanges.map((range, index) => (
                        <li key={index}>
                          {range.start} - {range.end}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  "No schedule assigned"
                )}
              </p>
            </div>
          </div>
        )}

        {viewMode === "register" && selectedActivity && (
          <div className="register-section">
            <button
              className="btn btn-back"
              onClick={() => setViewMode("activities")}
            >
              Back
            </button>
            <h2>Registration Request</h2>
            <form className="register-form" onSubmit={handleSubmitRegistration}>
              <div className="form-group" style={{maxHeight:'70px'}}>
                <label>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{maxHeight:'70px'}}>
                <label>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{maxHeight:'70px'}}>
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{maxHeight:'70px'}}>
                <label>Place of Birth</label>
                <input
                  type="text"
                  value={placeOfBirth}
                  onChange={(e) => setPlaceOfBirth(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{maxHeight:'70px'}}>
                <label>Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{maxHeight:'70px'}}>
                <label>Google Drive Link for Registration File</label>
                <input
                  type="url"
                  value={registrationFileLink}
                  onChange={(e) => setRegistrationFileLink(e.target.value)}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="p-3 py-2 rounded-xl text-center text-white bg-green-500">
                  Submit Request
                </button>
                <button
                  type="button"
                  className="p-3 py-2 rounded-xl text-center text-white bg-red-500"
                  onClick={() => setViewMode("activities")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home3Page;