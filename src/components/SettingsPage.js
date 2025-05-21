import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import "./SettingsPage.css";

const SettingsPage = () => {
  const navigate = useNavigate();

const [notificationMessage, setNotificationMessage] = useState("");
const [notifications, setNotifications] = useState([]);

  const [currentPage, setCurrentPage] = useState("settings");
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    birthDate: "",
    nationalId: "",
    linkcv: "",
  });

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Activities"));
        const activitiesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivities(activitiesList);
      } catch (error) {
        console.error("خطأ أثناء جلب الأنشطة:", error);
      }
    };
    const fetchNotifications = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "notifications"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(list);
      } catch (error) {
        console.error("خطأ في جلب الإشعارات:", error);
      }
    };
  

    if (currentPage === "edit-activities") {
      fetchActivities();
    }
    if (currentPage === "notifications") {
      fetchNotifications();
    }
  }, [currentPage]);

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      alert("تم حذف الإشعار.");
    } catch (error) {
      console.error("خطأ أثناء حذف الإشعار:", error);
      alert("فشل الحذف: " + error.message);
    }
  };
  
  const handleDelete = async (activityId) => {
    try {
      await deleteDoc(doc(db, "Activities", activityId));
      setActivities(activities.filter((activity) => activity.id !== activityId));
      alert("تم حذف النشاط بنجاح!");
    } catch (error) {
      console.error("خطأ أثناء الحذف:", error);
      alert("فشل حذف النشاط: " + error.message);
    }
  };

  const handlePreview = (activity) => {
    setSelectedActivity(activity);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedActivity(null);
  };

  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-10);
  };

  const handleAddActivity = async () => {
    const email = `${newActivity.firstName}@gmail.com`;
    const password = generateRandomPassword();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newDoc = {
        ...newActivity,
        email,
        password,    
        createdAt: serverTimestamp(),
        status: "pending",
      };
      const docRef = await addDoc(collection(db, "Activities"), newDoc);
      alert("تمت إضافة النشاط وإنشاء الحساب بنجاح!");
      setNewActivity({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        address: "",
        birthDate: "",
        nationalId: "",
        linkcv: "",
      });
      setCurrentPage("edit-activities");
    } catch (error) {
      console.error("خطأ أثناء إضافة النشاط:", error);
      alert("حدث خطأ: " + error.message);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <main className="col-md-9 d-flex justify-content-center min-w-full" >
          <div className="main-section p-4 rounded w-100">
            {currentPage === "settings" && (
              <div className="row">
                <div className="col-md-4 mb-3">
                  <button
                    className="btn btn-custom w-100"
                    onClick={() => setCurrentPage("notifications")}
                  >
                    Notifications
                  </button>
                </div>

                <div className="col-md-4 mb-3">
                  <button
                    className="btn btn-custom w-100"
                    onClick={() => setCurrentPage("edit-activities")}
                  >
                    Edit Activities
                  </button>
                </div>
                <div className="col-md-4 mb-3">
                  <button
                    className="btn btn-custom w-100"
                    onClick={() => setCurrentPage("add-activity")}
                  >
                    Add Activity
                  </button>
                </div>
              </div>
            )}

            {currentPage === "edit-activities" && (
              <div className="activities-list" style={{display:'flex', flexDirection:'column'}}>
                <h2 className="text-center mb-4">Activities list</h2>
                {activities.length === 0 ? (
                  <p className="text-center">There's any activities</p>
                ) : (
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity) => (
                        <tr key={activity.id}>
                          <td>{activity.email}</td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm me-2"
                              onClick={() => handleDelete(activity.id)}
                            >
                              Delete
                            </button>
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => handlePreview(activity)}
                            >
                              Preview
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {currentPage === "add-activity" && (
              <div className="add-activity-form">
                <h3 className="text-center mb-4">Add New Activity</h3>
                <div className="row">
                  {Object.entries(newActivity).map(([key, value]) => (
                    <div className="col-md-6 mb-3" key={key}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={key}
                        value={value}
                        onChange={(e) =>
                          setNewActivity({ ...newActivity, [key]: e.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
                <button className="btn btn-success w-100" onClick={handleAddActivity}>
                  Add
                </button>
              </div>
            )}
           {currentPage === "notifications" && (
  <div className="notifications-form">
    <h3 className="text-center mb-4">Send A Notification</h3>
    <textarea
      className="form-control mb-3"
      rows="4"
      placeholder="Write your notification"
      value={notificationMessage}
      onChange={(e) => setNotificationMessage(e.target.value)}
    />
    <button
      className="btn btn-primary w-100 mb-4"
      onClick={async () => {
        if (notificationMessage.trim() === "") {
          alert("Write a notification before sending ");
          return;
        }
        try {
          await addDoc(collection(db, "notifications"), {
            message: notificationMessage,
            createdAt: serverTimestamp(),
          });
          alert("Notification has been sent succussfully");
          setNotificationMessage("");
          setCurrentPage("reload-notifications"); // لإعادة تحميل القائمة
          setCurrentPage("notifications");
        } catch (error) {
          console.error("خطأ أثناء إرسال الإشعار:", error);
          alert("فشل إرسال الإشعار: " + error.message);
        }
      }}
    >
      Send
    </button>

    <h4 className="text-center mb-3">Previous Notifications</h4>
    {notifications.length === 0 ? (
      <p className="text-center">There's any notifications</p>
    ) : (
      <ul className="list-group">
        {notifications.map((notif) => (
          <li key={notif.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>📢</strong> {notif.message}
              <br />
              <small className="text-muted">
                {notif.createdAt?.toDate().toLocaleString() || "جارٍ التحميل..."}
              </small>
            </div>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteNotification(notif.id)}
            >
              حذف
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)}


          </div>
        </main>
      </div>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Activity Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedActivity && (
            <div>
              <p><strong>Id:</strong> {selectedActivity.id}</p>
              <p><strong>First Name</strong> {selectedActivity.firstName}</p>
              <p><strong>Last Name:</strong> {selectedActivity.lastName}</p>
              <p><strong>Email:</strong> {selectedActivity.email}</p>
              <p><strong>Passworx:</strong> {selectedActivity.password}</p>
              <p><strong>Phone Number:</strong> {selectedActivity.phoneNumber}</p>
              <p><strong>Address:</strong> {selectedActivity.address}</p>
              <p><strong>Birth Date:</strong> {selectedActivity.birthDate}</p>
              <p><strong>National Id:</strong> {selectedActivity.nationalId}</p>
              <p><strong>CV File:</strong> {selectedActivity.linkcv}</p>
              <p><strong>Status:</strong> {selectedActivity.status}</p>
              <p><strong>Creation Date:</strong> {selectedActivity.createdAt?.toDate().toLocaleString()}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SettingsPage;
