import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, setDoc, doc, orderBy, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { FaBell, FaSignOutAlt, FaUser, FaTasks, FaCog } from "react-icons/fa";
import { signOut, onAuthStateChanged } from "firebase/auth";
import axios from "axios"; // Added for Cloudinary upload
import "./HomePage.css";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Home2Page = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [viewMode, setViewMode] = useState("profile");
  const [activityName, setActivityName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [userDocId, setUserDocId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [subscriptionDays, setSubscriptionDays] = useState({ start: "", end: "" });
  const [subscriptionHours, setSubscriptionHours] = useState({ start: "", end: "" });
  const [groupNumber, setGroupNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [showEditActivityTimeModal, setShowEditActivityTimeModal] = useState(false);
  const [activityTimeRanges, setActivityTimeRanges] = useState([]);
  const [newTimeRange, setNewTimeRange] = useState({ start: "", end: "" });
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationPreviewModal, setShowNotificationPreviewModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
  const [showGroupScheduleModal, setShowGroupScheduleModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupSchedules, setGroupSchedules] = useState({});
  const [newGroupSchedule, setNewGroupSchedule] = useState({
    days: [],
    timeRanges: [{ start: "", end: "" }],
  });
  // New state for image upload
  const [activityImage, setActivityImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(false);
        fetchUserData(user);
      } else {
        setLoading(false);
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (user) => {
    try {
      const userEmail = user.email;
      const q = query(collection(db, "Activities"), where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setUserDocId(userDoc.id);
        const userData = userDoc.data();
        setActivityName(userData.activityName || "");
        setOrganizationName(userData.organizationName || "");
        setPhoneNumber(userData.phoneNumber || "");
        setEmail(userData.email || "");
        setGroups(userData.groups || []);
        setActivityTimeRanges(userData.activityTimeRanges || []);
        setGroupSchedules(userData.groupSchedules || {});
        setActivityImage(userData.activityImage || ""); // Load existing image

        const requestsQuery = query(collection(db, `Activities/${userDoc.id}/domande`));
        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsList = requestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRequests(requestsList);
      } else {
        setActivityName("");
        setOrganizationName("");
        setPhoneNumber("");
        setEmail(userEmail);
        setActivityImage("");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Cloudinary upload function
  const uploadImageToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "babyshop");

      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dtrhfv6km/image/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        return response.data.secure_url;
      } else {
        throw new Error(response.data.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Handle image selection and upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImageUploadLoading(true);
    setImageUploadError("");

    try {
      const imageUrl = await uploadImageToCloudinary(file);
      setActivityImage(imageUrl);
      setImageUploadLoading(false);
      alert("Image uploaded successfully!");
    } catch (error) {
      setImageUploadError("Failed to upload image.");
      setImageUploadLoading(false);
      alert("Failed to upload image: " + error.message);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const allNotifications = [];
        const globalNotificationsQuery = query(
          collection(db, "notifications"),
          orderBy("createdAt", "desc")
        );
        const globalNotificationsSnapshot = await getDocs(globalNotificationsQuery);
        const globalNotificationsList = globalNotificationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          docRef: doc.ref,
          ...doc.data(),
        }));
        allNotifications.push(...globalNotificationsList);

        if (userDocId) {
          const activityNotificationsQuery = query(
            collection(db, `Activities/${userDocId}/notifications`),
            orderBy("createdAt", "desc")
          );
          const activityNotificationsSnapshot = await getDocs(activityNotificationsQuery);
          const activityNotificationsList = activityNotificationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            docRef: doc.ref,
            ...doc.data(),
          }));
          allNotifications.push(...activityNotificationsList);
        }

        allNotifications.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
        setNotifications(allNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [userDocId]);

  const markNotificationsAsRead = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      for (const notification of notifications) {
        if (!notification.readBy?.includes(userId)) {
          await updateDoc(notification.docRef, {
            readBy: arrayUnion(userId),
          });
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id ? { ...n, readBy: [...(n.readBy || []), userId] } : n
            )
          );
        }
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed: " + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userEmail = auth.currentUser.email;
      const userData = {
        activityName,
        organizationName,
        phoneNumber,
        email: userEmail,
        updatedAt: new Date(),
        groupSchedules,
        activityImage, // Save image URL
      };

      if (userDocId) {
        await setDoc(doc(db, "Activities", userDocId), userData, { merge: true });
        alert("Information updated successfully!");
      } else {
        const newDocRef = doc(collection(db, "Activities"));
        await setDoc(newDocRef, {
          ...userData,
          email: userEmail,
          groups: [],
          activityTimeRanges: [],
          groupSchedules: {},
          activityImage,
        });
        setUserDocId(newDocRef.id);
        alert("Information saved successfully!");
      }
    } catch (error) {
      console.error("Error saving information:", error);
      alert("Failed to save information: " + error.message);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestDetailsModal(true);
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      const requestToDelete = requests.find((r) => r.id === requestId);
      await deleteDoc(doc(db, `Activities/${userDocId}/domande`, requestId));
      setRequests(requests.filter((request) => request.id !== requestId));
      setSelectedRequest(null);
      setShowRequestDetailsModal(false);

      const userQuery = query(collection(db, "users"), where("uid", "==", requestToDelete.userId));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userDocId = userDoc.id;
        await setDoc(doc(collection(db, `users/${userDocId}/notifications`)), {
          message: `Your registration request for activity ${activityName || "unknown"} was rejected`,
          createdAt: new Date(),
          readBy: [],
        });
      }

      alert("Request deleted successfully!");
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request: " + error.message);
    }
  };

  const openAcceptModal = (request) => {
    setCurrentRequest(request);
    setShowAcceptModal(true);
  };

  const handleAcceptRequest = async (e) => {
    e.preventDefault();
    try {
      if (!subscriptionDays.start || !subscriptionDays.end || !subscriptionHours.start || !subscriptionHours.end || !groupNumber) {
        alert("Please fill in all fields!");
        return;
      }

      if (new Date(subscriptionDays.end) < new Date(subscriptionDays.start)) {
        alert("End date must be after start date!");
        return;
      }

      const activityEnterDocRef = doc(collection(db, `Activities/${userDocId}/enter`), currentRequest.userId);
      await setDoc(activityEnterDocRef, {
        firstName: currentRequest.firstName,
        lastName: currentRequest.lastName,
        dateOfBirth: currentRequest.dateOfBirth,
        placeOfBirth: currentRequest.placeOfBirth,
        phone: currentRequest.phone,
        registrationFileLink: currentRequest.registrationFileLink,
        userId: currentRequest.userId,
        userEmail: currentRequest.userEmail,
        subscriptionDays: {
          start: subscriptionDays.start,
          end: subscriptionDays.end,
        },
        subscriptionHours: {
          start: subscriptionHours.start,
          end: subscriptionHours.end,
        },
        groupNumber: groupNumber,
        createdAt: new Date(),
      });

      const userQuery = query(collection(db, "users"), where("uid", "==", currentRequest.userId));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error("User not found in users collection");
      }

      const userDoc = userSnapshot.docs[0];
      const userIdFromUsers = userDoc.id;

      const enterCollectionRef = collection(db, `users/${userIdFromUsers}/enter`);
      const enterQuery = query(enterCollectionRef, where("uid", "==", currentRequest.userId));
      const enterSnapshot = await getDocs(enterQuery);

      let userEnterDocRef;
      if (!enterSnapshot.empty) {
        const enterDoc = enterSnapshot.docs[0];
        userEnterDocRef = doc(db, `users/${userIdFromUsers}/enter`, enterDoc.id);
      } else {
        userEnterDocRef = doc(enterCollectionRef);
        await setDoc(userEnterDocRef, {
          uid: currentRequest.userId,
          createdAt: new Date(),
        });
      }

      await setDoc(
        userEnterDocRef,
        {
          activityId: userDocId,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      await setDoc(doc(collection(db, `users/${userIdFromUsers}/notifications`)), {
        message: `Your registration request for activity ${activityName} was accepted`,
        createdAt: new Date(),
        readBy: [],
      });

      await deleteDoc(doc(db, `Activities/${userDocId}/domande`, currentRequest.id));
      setRequests(requests.filter((r) => r.id !== currentRequest.id));
      setSelectedRequest(null);
      setShowAcceptModal(false);
      alert("Request accepted and moved to members successfully!");

      setSubscriptionDays({ start: "", end: "" });
      setSubscriptionHours({ start: "", end: "" });
      setGroupNumber("");
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request: " + error.message);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName) {
      alert("Please enter a group name!");
      return;
    }

    try {
      const activityDocRef = doc(db, "Activities", userDocId);
      await updateDoc(activityDocRef, {
        groups: arrayUnion(newGroupName),
      });

      setGroups([...groups, newGroupName]);
      setNewGroupName("");
      setShowAddGroupModal(false);
      alert("Group added successfully!");
    } catch (error) {
      console.error("Error adding group:", error);
      alert("Failed to add group: " + error.message);
    }
  };

  const handleViewGroupMembers = async (groupName) => {
    try {
      const enterQuery = query(
        collection(db, `Activities/${userDocId}/enter`),
        where("groupNumber", "==", groupName)
      );
      const enterSnapshot = await getDocs(enterQuery);
      let members = enterSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const today = new Date();
      const expiredMembers = [];
      const nearingEndMembers = [];

      for (const member of members) {
        const endDate = new Date(member.subscriptionDays?.end);
        if (endDate < today) {
          expiredMembers.push(member);
        } else if ((endDate - today) / (1000 * 60 * 60 * 24) <= 3) {
          nearingEndMembers.push(member);
        }
      }

      for (const member of expiredMembers) {
        await handleRemoveMember(member.userId, member.userEmail, false);
      }

      for (const member of nearingEndMembers) {
        const userQuery = query(collection(db, "users"), where("uid", "==", member.userId));
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userDocId = userDoc.id;
          await setDoc(doc(collection(db, `users/${userDocId}/notifications`)), {
            message: `Your subscription for activity ${activityName || "unknown"} is nearing its end on ${new Date(member.subscriptionDays.end).toLocaleDateString("en-US")}`,
            createdAt: new Date(),
            readBy: [],
          });
        }
      }

      members = members.filter((member) => !expiredMembers.includes(member));
      setSelectedGroupMembers(members);
      setShowGroupMembersModal(true);
    } catch (error) {
      console.error("Error fetching members:", error);
      alert("Failed to fetch members: " + error.message);
    }
  };

  const handleRemoveMember = async (userId, userEmail, notify = true) => {
    try {
      await deleteDoc(doc(db, `Activities/${userDocId}/enter`, userId));

      const userQuery = query(collection(db, "users"), where("uid", "==", userId));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userDocId = userDoc.id;
        const enterQuery = query(collection(db, `users/${userDocId}/enter`), where("activityId", "==", userDocId));
        const enterSnapshot = await getDocs(enterQuery);
        if (!enterSnapshot.empty) {
          const enterDoc = enterSnapshot.docs[0];
          await deleteDoc(doc(db, `users/${userDocId}/enter`, enterDoc.id));
        }

        if (notify) {
          await setDoc(doc(collection(db, `users/${userDocId}/notifications`)), {
            message: `You have been removed from the group in activity ${activityName || "unknown"}`,
            createdAt: new Date(),
            readBy: [],
          });
        }
      }

      setSelectedGroupMembers((prev) => prev.filter((member) => member.userId !== userId));
      if (notify) {
        alert("Member removed successfully!");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      if (notify) {
        alert("Failed to remove member: " + error.message);
      }
    }
  };

  const handleDeleteGroup = async (groupName) => {
    try {
      const enterQuery = query(
        collection(db, `Activities/${userDocId}/enter`),
        where("groupNumber", "==", groupName)
      );
      const enterSnapshot = await getDocs(enterQuery);
      for (const doc of enterSnapshot.docs) {
        const member = doc.data();
        await handleRemoveMember(member.userId, member.userEmail, true);
      }

      const activityDocRef = doc(db, "Activities", userDocId);
      await updateDoc(activityDocRef, {
        groups: arrayRemove(groupName),
        groupSchedules: { ...groupSchedules, [groupName]: null },
      });

      setGroups(groups.filter((group) => group !== groupName));
      setGroupSchedules((prev) => {
        const updated = { ...prev };
        delete updated[groupName];
        return updated;
      });
      alert("Group deleted successfully!");
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group: " + error.message);
    }
  };

  const handleAddTimeRange = () => {
    if (!newTimeRange.start || !newTimeRange.end) {
      alert("Please enter start and end times!");
      return;
    }

    const updatedRanges = [...activityTimeRanges, newTimeRange];
    setActivityTimeRanges(updatedRanges);
    setNewTimeRange({ start: "", end: "" });
  };

  const handleSaveActivityTime = async () => {
    try {
      const activityDocRef = doc(db, "Activities", userDocId);
      await updateDoc(activityDocRef, {
        activityTimeRanges: activityTimeRanges,
      });
      setShowEditActivityTimeModal(false);
      alert("Activity times updated successfully!");
    } catch (error) {
      console.error("Error updating activity times:", error);
      alert("Failed to update activity times: " + error.message);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMessage) {
      alert("Please enter notification text!");
      return;
    }

    try {
      const enterSnapshot = await getDocs(collection(db, `Activities/${userDocId}/enter`));
      const userIds = enterSnapshot.docs.map((doc) => doc.data().userId);

      for (const userId of userIds) {
        const userQuery = query(collection(db, "users"), where("uid", "==", userId));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userDocId = userDoc.id;

          await setDoc(doc(collection(db, `users/${userDocId}/notifications`)), {
            message: notificationMessage,
            createdAt: new Date(),
            readBy: [],
          });
        }
      }

      setNotificationMessage("");
      setShowNotificationModal(false);
      alert("Notification sent successfully!");
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Failed to send notification: " + error.message);
    }
  };

  const handleViewNotification = (notification) => {
    setSelectedNotification(notification);
    setShowNotificationPreviewModal(true);
  };

  const openGroupScheduleModal = (groupName) => {
    setSelectedGroup(groupName);
    setNewGroupSchedule(
      groupSchedules[groupName] || { days: [], timeRanges: [{ start: "", end: "" }] }
    );
    setShowGroupScheduleModal(true);
  };

  const handleAddGroupTimeRange = () => {
    setNewGroupSchedule({
      ...newGroupSchedule,
      timeRanges: [...newGroupSchedule.timeRanges, { start: "", end: "" }],
    });
  };

  const handleGroupScheduleChange = (index, field, value) => {
    const updatedTimeRanges = [...newGroupSchedule.timeRanges];
    updatedTimeRanges[index] = { ...updatedTimeRanges[index], [field]: value };
    setNewGroupSchedule({ ...newGroupSchedule, timeRanges: updatedTimeRanges });
  };

  const handleDayToggle = (day) => {
    setNewGroupSchedule((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSaveGroupSchedule = async () => {
    if (!newGroupSchedule.days.length || newGroupSchedule.timeRanges.some((tr) => !tr.start || !tr.end)) {
      alert("Please select at least one day and fill all time ranges!");
      return;
    }

    try {
      const updatedSchedules = {
        ...groupSchedules,
        [selectedGroup]: newGroupSchedule,
      };
      const activityDocRef = doc(db, "Activities", userDocId);
      await updateDoc(activityDocRef, {
        groupSchedules: updatedSchedules,
      });

      setGroupSchedules(updatedSchedules);
      setShowGroupScheduleModal(false);
      setNewGroupSchedule({ days: [], timeRanges: [{ start: "", end: "" }] });
      alert("Group schedule updated successfully!");
    } catch (error) {
      console.error("Error updating group schedule:", error);
      alert("Failed to update group schedule: " + error.message);
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
    <div className="home-container text-start ltr" style={{direction: 'rtl'}}>
      {/* <header className="home-header">
        <div className="header-left">
        <div className="notification-wrapper" style={{ position: "relative" }}>
            <FaBell
              size={24}
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markNotificationsAsRead();
              }}
            />
            {notifications.filter((n) => !n.readBy?.includes(auth.currentUser?.uid)).length > 0 && (
              <span className="notification-badge">
                {notifications.filter((n) => !n.readBy?.includes(auth.currentUser?.uid)).length}
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
                  <p>No notifications available</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="notification-item"
                      style={{
                        backgroundColor: notification.readBy?.includes(auth.currentUser?.uid) ? "#f9f9f9" : "#e6f3ff",
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
                      <button
                        className="btn btn-primary btn-sm mt-2"
                        onClick={() => handleViewNotification(notification)}
                      >
                        Preview
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <h1>Business Consultant</h1>
        </div>
       
      </header> */}

      <div className="fixed left-0 bg-white w-[300px] h-[100vh] top-0" style={{}}>
        <div className="font-bold text-xl p-10 text-center">
            Business Consultant
        </div>
        <nav className="sidebar w-full">
          <button
            className={`sidebar-btn ${viewMode === "profile" ? "active" : ""}`}
            onClick={() => setViewMode("profile")}
          >
            <FaUser /> Profile
          </button>
          <button
            className={`sidebar-btn ${viewMode === "requests" ? "active" : ""}`}
            onClick={() => setViewMode("requests")}
          >
            <FaTasks /> Manage Requests
          </button>
          <button
            className={`sidebar-btn ${viewMode === "settings" ? "active" : ""}`}
            onClick={() => setViewMode("settings")}
          >
            <FaCog /> Settings
          </button>
          <div className="flex-1 flex items-end pb-20">
            <button className="sidebar-btn bg-red-500 text-white" onClick={handleLogout} style={{background:"red"}}>
              <FaSignOutAlt /> Log Out
            </button>
          </div>
        </nav>
      </div>
      <main className="content">
        {viewMode === "profile" && (
          <div className="details-section">
            <h2>Profile</h2>
            <div className="details-card">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="activityName">Activity Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="activityName"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="organizationName">Organization Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="organizationName"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="activityImage">Activity Image</label>
                  <input
                    type="file"
                    className="form-control"
                    id="activityImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploadLoading}
                  />
                  {imageUploadLoading && <div className="spinner mt-2"></div>}
                  {imageUploadError && (
                    <p className="text-danger mt-2">{imageUploadError}</p>
                  )}
                  {activityImage && (
                    <div className="image-preview mt-2">
                      <img src={activityImage} alt="Activity" />
                    </div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </form>
            </div>
          </div>
        )}

        {viewMode === "requests" && (
          <div className="manage-requests-section text-start">
            <h2 className="">Manage Requests</h2>
            {requests.length === 0 ? (
              <p>No requests available</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="h-fit p-4 rounded-2xl bg-white mb-5">
                  <div className="flex justify-between flex-row-reverse items-center">
                    <strong>{request.firstName} {request.lastName}</strong>
                    <div className="flex gap-3">
                      <button
                        className="p-3 py-2 rounded-xl text-center text-white bg-gray-500"
                        onClick={() => handleViewRequest(request)}
                      >
                        View
                      </button>
                      <button
                        className="p-3 py-2 rounded-xl text-center text-white bg-green-500"
                        onClick={() => openAcceptModal(request)}
                      >
                        Accept
                      </button>
                      <button
                        className="p-3 py-2 rounded-xl text-center text-white bg-red-500"
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === "settings" && (
          <div className="settings-section">
            {userDocId ? (
              <>
                <h2>Settings</h2>
                <div className="form-row">
                  <div className="form-group">
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddGroupModal(true)}
                    >
                      Add Group
                    </button>
                  </div>
                  <div className="form-group">
                    <button
                      className="btn btn-primary "
                      onClick={() => setShowEditActivityTimeModal(true)}
                    >
                      Edit Activity Time
                    </button>
                  </div>
                  <div className="form-group">
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowNotificationModal(true)}
                    >
                      Send Notification
                    </button>
                  </div>
                </div>
                <h2>Existing Groups</h2>
                {groups.length > 0 ? (
                  groups.map((group, index) => (
                    <div key={index} className="p-3 rounded-lg bg-white h-fit mb-2">
                      <div className="form-group">
                        <strong className="font-bold text-xl">{group}</strong>
                        <div className="button-group flex gap-2">
                          <button
                            className="w-full p-2 bg-green-500 mt-3 text-white font-medium rounded-lg"
                            onClick={() => handleViewGroupMembers(group)}
                          >
                            View Members
                          </button>
                          <button
                            className="w-full p-2 bg-green-500 mt-3 text-white font-medium rounded-lg"
                            onClick={() => openGroupScheduleModal(group)}
                          >
                            Edit Schedule
                          </button>
                          <button
                            className="w-full p-2 bg-red-500 mt-3 text-white font-medium rounded-lg"
                            onClick={() => handleDeleteGroup(group)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No groups available</p>
                )}
              </>
            ) : (
              <p>Please save your profile information first from the Profile section.</p>
            )}
          </div>
        )}
      </main>

      <Modal show={showAcceptModal} onHide={() => setShowAcceptModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Enter Subscription Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleAcceptRequest} className="text-left"> 
            <div className="mb-3 flex flex-row-reverse items-center gap-4">
              <label htmlFor="subscriptionDaysStart" className="form-label">
                Subscription Start Date
              </label>
              <DatePicker
                selected={subscriptionDays.start}
                onChange={(date) => setSubscriptionDays({ ...subscriptionDays, start: date })}
                dateFormat="dd/MM/yyyy"
                className="form-control"
                placeholderText="Select start date"
                required
              />
            </div>
            <div className="mb-3 flex flex-row-reverse items-center gap-4">
              <label htmlFor="subscriptionDaysEnd" className="form-label">
                Subscription End Date
              </label>
              <DatePicker
                selected={subscriptionDays.end}
                onChange={(date) => setSubscriptionDays({ ...subscriptionDays, end: date })}
                dateFormat="dd/MM/yyyy"
                className="form-control"
                placeholderText="Select end date"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="subscriptionHoursStart" className="form-label">
                Start Time
              </label>
              <input
                type="time"
                className="form-control"
                id="subscriptionHoursStart"
                value={subscriptionHours.start}
                onChange={(e) => setSubscriptionHours({ ...subscriptionHours, start: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="subscriptionHoursEnd" className="form-label">
                End Time
              </label>
              <input
                type="time"
                className="form-control"
                id="subscriptionHoursEnd"
                value={subscriptionHours.end}
                onChange={(e) => setSubscriptionHours({ ...subscriptionHours, end: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="groupNumber" className="form-label">
                Select Group
              </label>
              <select
                className="form-control"
                id="groupNumber"
                value={groupNumber}
                onChange={(e) => setGroupNumber(e.target.value)}
                required
              >
                <option value="">Select Group</option>
                {groups.map((group, index) => (
                  <option key={index} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              {groups.length === 0 && (
                <p className="text-danger mt-2">No groups available, please add one from settings.</p>
              )}
            </div>
            <button className="p-3 py-2 rounded-xl text-center text-white bg-green-500 w-full mb-2" type="submit" disabled={groups.length === 0}>
              Confirm Acceptance
            </button>
            <button className="p-3 py-2 rounded-xl text-center text-white bg-red-500 w-full" onClick={() => setShowAcceptModal(false)}>
              Cancel
            </button>
          </form>
        </Modal.Body>
      </Modal>

      <Modal show={showAddGroupModal} onHide={() => setShowAddGroupModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title style={{flexDirection: 'row-reverse', direction:'ltr'}}>Add New Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3 text-left">
            <label htmlFor="newGroupName" className="form-label">
              Group Name
            </label>
            <input
              type="text"
              className="form-control"
              id="newGroupName"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
            />
          </div>
          <button className="p-3 py-2 rounded-xl text-center text-white bg-red-500" onClick={() => setShowAddGroupModal(false)}>
            Cancel
          </button>
          <button className="p-3 py-2 rounded-xl text-center text-white bg-green-500 ml-5" onClick={handleAddGroup}>
            Add
          </button>
        </Modal.Body>
      </Modal>

      <Modal show={showGroupMembersModal} onHide={() => setShowGroupMembersModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Group Members</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGroupMembers.length > 0 ? (
            selectedGroupMembers.map((member, index) => {
              const endDate = new Date(member.subscriptionDays?.end);
              const today = new Date();
              const daysUntilEnd = (endDate - today) / (1000 * 60 * 60 * 24);
              const isNearingEnd = daysUntilEnd <= 3 && daysUntilEnd >= 0;

              return (
                <div key={index} className="mb-2 p-2 border rounded position-relative ltr" style={{direction:'ltr'}}>
                  <p><strong>Name:</strong> {member.firstName} {member.lastName}</p>
                  <p><strong>Email:</strong> {member.userEmail}</p>
                  <p>
                    <strong>Subscription:</strong>{" "}
                    {member.subscriptionDays?.start
                      ? (member.subscriptionDays.start.toDate()).toLocaleDateString("en-US")
                      : "N/A"}{" "}
                    -{" "}
                    {member.subscriptionDays?.end
                      ? (member.subscriptionDays.end.toDate()).toLocaleDateString("en-US")
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Hours:</strong>{" "}
                    {member.subscriptionHours?.start && member.subscriptionHours?.end
                      ? `${member.subscriptionHours.start} - ${member.subscriptionHours.end}`
                      : "N/A"}
                  </p>
                  {isNearingEnd && (
                    <span
                      className="badge bg-warning text-dark position-absolute"
                      style={{ top: "10px", right: "10px" }}
                    >
                      Nearing End
                    </span>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleRemoveMember(member.userId, member.userEmail)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="text-center">No members in this group</p>
          )}
          <Button variant="secondary" className="w-100 mt-2" onClick={() => setShowGroupMembersModal(false)}>
            Close
          </Button>
        </Modal.Body>
      </Modal>

      <Modal show={showEditActivityTimeModal} onHide={() => setShowEditActivityTimeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="">Edit Activity Time</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Add New Time Range</label>
            <div className="d-flex mb-2">
              <input
                type="time"
                className="form-control me-2"
                value={newTimeRange.start}
                onChange={(e) => setNewTimeRange({ ...newTimeRange, start: e.target.value })}
              />
              <input
                type="time"
                className="form-control"
                value={newTimeRange.end}
                onChange={(e) => setNewTimeRange({ ...newTimeRange, end: e.target.value })}
              />
            </div>
            <Button variant="primary" onClick={handleAddTimeRange}>
              Add Range
            </Button>
          </div>
          <div>
            <h5>Existing Ranges:</h5>
            {activityTimeRanges.length > 0 ? (
              activityTimeRanges.map((range, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <p>
                    From {range.start} to {range.end}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center">No time ranges available</p>
            )}
          </div>
          <div className="flex gap-4">
            <button  className="p-2 rounded-lg text-white bg-green-300" onClick={handleSaveActivityTime}>
              Save Changes
            </button>
            <button  className="p-2 rounded-lg text-white bg-red-300"  style={{background:"red"}} onClick={() => setShowEditActivityTimeModal(false)}>
              Cancel
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showNotificationModal} onHide={() => setShowNotificationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Send Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="notificationMessage" className="form-label">
              Notification Text
            </label>
            <textarea
              className="form-control"
              id="notificationMessage"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <button className="w-full p-2 bg-green-500 mt-3 text-white font-medium rounded-lg" onClick={handleSendNotification}>
              Send
            </button>
            <button className="w-full p-2 bg-red-500 mt-3 text-white font-medium rounded-lg" onClick={() => setShowNotificationModal(false)}>
              Cancel
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showNotificationPreviewModal} onHide={() => setShowNotificationPreviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Notification Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNotification ? (
            <div>
              <p><strong>Message:</strong> {selectedNotification.message}</p>
              <p><strong>Date:</strong> {selectedNotification.createdAt?.toDate().toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
              <p><strong>Read By:</strong> {selectedNotification.readBy?.length > 0 ? selectedNotification.readBy.join(", ") : "Not read yet"}</p>
            </div>
          ) : (
            <p>No notification selected</p>
          )}
          <Button variant="secondary" className="w-100 mt-2" onClick={() => setShowNotificationPreviewModal(false)}>
            Close
          </Button>
        </Modal.Body>
      </Modal>

      <Modal show={showRequestDetailsModal} onHide={() => setShowRequestDetailsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest ? (
            <div>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" className="form-control" value={selectedRequest.firstName} disabled />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" className="form-control" value={selectedRequest.lastName} disabled />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="text" className="form-control" value={selectedRequest.dateOfBirth} disabled />
              </div>
              <div className="form-group">
                <label>Place of Birth</label>
                <input type="text" className="form-control" value={selectedRequest.placeOfBirth} disabled />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" className="form-control" value={selectedRequest.phone} disabled />
              </div>
              <div className="form-group">
                <label>Registration File</label>
                <a
                  href={selectedRequest.registrationFileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cv-link"
                >
                  View File
                </a>
              </div>
            </div>
          ) : (
            <p>No request selected</p>
          )}
          <Button variant="secondary" className="w-100 mt-2" onClick={() => setShowRequestDetailsModal(false)}>
            Close
          </Button>
        </Modal.Body>
      </Modal>

      <Modal show={showGroupScheduleModal} onHide={() => setShowGroupScheduleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Group Schedule for {selectedGroup}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Select Days of the Week</label>
            <div className="d-flex flex-wrap">
              {daysOfWeek.map((day) => (
                <div key={day} className="form-check me-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`day-${day}`}
                    checked={newGroupSchedule.days.includes(day)}
                    onChange={() => handleDayToggle(day)}
                  />
                  <label className="form-check-label" htmlFor={`day-${day}`}>
                    {day}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Time Ranges</label>
            {newGroupSchedule.timeRanges.map((range, index) => (
              <div key={index} className="d-flex mb-2">
                <input
                  type="time"
                  className="form-control me-2"
                  value={range.start}
                  onChange={(e) => handleGroupScheduleChange(index, "start", e.target.value)}
                />
                <input
                  type="time"
                  className="form-control"
                  value={range.end}
                  onChange={(e) => handleGroupScheduleChange(index, "end", e.target.value)}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button className="w-full p-2 bg-green-500 mt-3 text-white font-medium rounded-lg" onClick={handleAddGroupTimeRange}>
                Add Time Range
              </button>
              </div>
              <button className="w-full p-2 bg-green-500 mt-3 text-white font-medium rounded-lg" onClick={handleSaveGroupSchedule}>
                Save Schedule
              </button>
              <button className="w-full p-2 bg-red-500 mt-3 text-white font-medium rounded-lg" onClick={() => setShowGroupScheduleModal(false)}>
                Cancel
              </button>
            </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Home2Page;