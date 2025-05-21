import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HomePage.css";
import { db, auth } from "../firebase";
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { collection, getDocs, query, where, setDoc, doc, orderBy, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { FaBell } from "react-icons/fa";
import { signOut } from "firebase/auth";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Home2Page = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [userDocId, setUserDocId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [subscriptionDays, setSubscriptionDays] = useState({ start: null, end: null });
  const [subscriptionHours, setSubscriptionHours] = useState({ start: "", end: "" });
  const [groupNumber, setGroupNumber] = useState(""); // سيتم استخدامه لتخزين الفوج المختار
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
      }
    } catch (error) {
      console.error("خطأ أثناء جلب بيانات المستخدم:", error);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const notificationsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notificationsList);
      } catch (error) {
        console.error("خطأ أثناء جلب الإشعارات:", error);
      }
    };

    fetchNotifications();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("تم تسجيل الخروج بنجاح!");
      navigate("/login");
    } catch (error) {
      console.error("فشل تسجيل الخروج:", error);
      alert("فشل تسجيل الخروج: " + error.message);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const togglePersonalInfo = () => {
    setShowPersonalInfo(!showPersonalInfo);
    setShowRequests(false);
    setShowSettings(false);
    setSelectedRequest(null);
  };

  const toggleRequests = () => {
    setShowRequests(!showRequests);
    setShowPersonalInfo(false);
    setShowSettings(false);
    setSelectedRequest(null);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    setShowPersonalInfo(false);
    setShowRequests(false);
    setSelectedRequest(null);
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
      };

      if (userDocId) {
        await setDoc(doc(db, "Activities", userDocId), userData, { merge: true });
        alert("تم تحديث المعلومات بنجاح!");
      } else {
        const newDocRef = doc(collection(db, "Activities"));
        await setDoc(newDocRef, { ...userData, email: userEmail });
        setUserDocId(newDocRef.id);
        alert("تم حفظ المعلومات بنجاح!");
      }
    } catch (error) {
      console.error("خطأ أثناء حفظ المعلومات:", error);
      alert("فشل حفظ المعلومات: " + error.message);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, `Activities/${userDocId}/domande`, requestId));
      setRequests(requests.filter((request) => request.id !== requestId));
      setSelectedRequest(null);
      await setDoc(doc(collection(db, "notifications")), {
        message: `تم رفض طلب تسجيلك في النشاط ${selectedRequest.activityName}`,
        createdAt: new Date(),
        userId: selectedRequest.userId,
      });
      alert("تم حذف الطلب بنجاح!");
    } catch (error) {
      console.error("خطأ أثناء حذف الطلب:", error);
      alert("فشل حذف الطلب: " + error.message);
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
        alert("يرجى ملء جميع الحقول!");
        return;
      }

      if (subscriptionDays.end < subscriptionDays.start) {
        alert("تاريخ النهاية يجب أن يكون بعد تاريخ البداية!");
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
        groupNumber: groupNumber, // استخدام القيمة المختارة من القائمة المنسدلة
        createdAt: new Date(),
      });

      const userQuery = query(collection(db, "users"), where("uid", "==", currentRequest.userId));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error("المستخدم غير موجود في مجموعة users");
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

      await setDoc(doc(collection(db, "notifications")), {
        message: `تم قبول طلب تسجيلك في النشاط ${activityName}`,
        createdAt: new Date(),
        userId: currentRequest.userId,
      });

      await deleteDoc(doc(db, `Activities/${userDocId}/domande`, currentRequest.id));
      setRequests(requests.filter((r) => r.id !== currentRequest.id));
      setSelectedRequest(null);
      setShowAcceptModal(false);
      alert("تم قبول الطلب ونقله إلى الأعضاء بنجاح!");

      setSubscriptionDays({ start: null, end: null });
      setSubscriptionHours({ start: "", end: "" });
      setGroupNumber("");
    } catch (error) {
      console.error("خطأ أثناء قبول الطلب:", error);
      alert("فشل قبول الطلب: " + error.message);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName) {
      alert("يرجى إدخال اسم الفوج!");
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
      alert("تم إضافة الفوج بنجاح!");
    } catch (error) {
      console.error("خطأ أثناء إضافة الفوج:", error);
      alert("فشل إضافة الفوج: " + error.message);
    }
  };

  const handleViewGroupMembers = async (groupName) => {
    try {
      const enterQuery = query(
        collection(db, `Activities/${userDocId}/enter`),
        where("groupNumber", "==", groupName)
      );
      const enterSnapshot = await getDocs(enterQuery);
      const members = enterSnapshot.docs.map((doc) => doc.data());
      setSelectedGroupMembers(members);
      setShowGroupMembersModal(true);
    } catch (error) {
      console.error("خطأ أثناء جلب المشتركين:", error);
      alert("فشل جلب المشتركين: " + error.message);
    }
  };

  const handleDeleteGroup = async (groupName) => {
    try {
      const activityDocRef = doc(db, "Activities", userDocId);
      await updateDoc(activityDocRef, {
        groups: arrayRemove(groupName),
      });

      setGroups(groups.filter((group) => group !== groupName));
      alert("تم حذف الفوج بنجاح!");
    } catch (error) {
      console.error("خطأ أثناء حذف الفوج:", error);
      alert("فشل حذف الفوج: " + error.message);
    }
  };

  const handleAddTimeRange = () => {
    if (!newTimeRange.start || !newTimeRange.end) {
      alert("يرجى إدخال بداية ونهاية الساعات!");
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
      alert("تم تحديث أوقات النشاط بنجاح!");
    } catch (error) {
      console.error("خطأ أثناء تحديث أوقات النشاط:", error);
      alert("فشل تحديث أوقات النشاط: " + error.message);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMessage) {
      alert("يرجى إدخال نص الإشعار!");
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
          });
        }
      }

      setNotificationMessage("");
      setShowNotificationModal(false);
      alert("تم إرسال الإشعار بنجاح!");
    } catch (error) {
      console.error("خطأ أثناء إرسال الإشعار:", error);
      alert("فشل إرسال الإشعار: " + error.message);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">جاري التحميل...</div>;
  }

  return (
    <div className="container-fluid">
      <header className="header py-3 mb-0 position-relative">
        <div className="d-flex justify-content-between align-items-center">
          <div className="notification-icon ms-3">
            <FaBell size={24} onClick={toggleNotifications} style={{ cursor: "pointer" }} />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
            {showNotifications && (
              <div className="notification-dropdown">
                <h5 className="dropdown-header">الإشعارات</h5>
                {notifications.length === 0 ? (
                  <p className="dropdown-item text-center">لا توجد إشعارات</p>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="dropdown-item">
                      <p className="mb-1">{notification.message}</p>
                      <small>
                        {notification.createdAt?.toDate().toLocaleString("ar-EG", {
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
          <h1 className="text-center flex-grow-1 mb-0">
            سجل دخولك بمستشار الأعمال
          </h1>
          <div className="empty-space"></div>
        </div>
      </header>

      <div className="row">
        <main className="col-md-9 d-flex justify-content-center">
          <div className="main-section p-4 rounded w-100">
            {!showPersonalInfo && !showRequests && !showSettings ? (
              <div className="row">
                <div className="col-md-4 mb-3">
                  <button
                    className="btn btn-custom w-100"
                    onClick={() => navigate("/individuals")}
                  >
                    الأفراد
                  </button>
                </div>
                <div className="col-md-4 mb-3">
                  <button
                    className="btn btn-custom w-100"
                    onClick={() => navigate("/entities")}
                  >
                    الجهات
                  </button>
                </div>
                <div className="col-md-4 mb-3">
                  <button
                    className="btn btn-custom w-100"
                    onClick={() => navigate("/plan")}
                  >
                    خطة
                  </button>
                </div>
              </div>
            ) : showPersonalInfo ? (
              <div>
                <h2 className="text-center mb-4">معلومات شخصية</h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="activityName" className="form-label">
                      اسم النشاط
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="activityName"
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="organizationName" className="form-label">
                      اسم المؤسسة
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="organizationName"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label">
                      رقم الهاتف
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      الإيميل
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      disabled
                    />
                  </div>
                  <button type="submit" className="btn btn-custom w-100">
                    تأكيد
                  </button>
                </form>
              </div>
            ) : showRequests ? (
              <div>
                <h2 className="text-center mb-4">إدارة الطلبات</h2>
                {requests.length === 0 ? (
                  <p className="text-center">لا توجد طلبات متاحة</p>
                ) : (
                  <div>
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className="d-flex justify-content-between align-items-center mb-3 p-2 border rounded"
                      >
                        <span>
                          {request.firstName} {request.lastName}
                        </span>
                        <div>
                          <button
                            className="btn btn-primary btn-sm me-2"
                            onClick={() => handleViewRequest(request)}
                          >
                            معاينة
                          </button>
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => openAcceptModal(request)}
                          >
                            قبول
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteRequest(request.id)}
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                    {selectedRequest && (
                      <div className="mt-4 p-3 border rounded">
                        <h4 className="text-center">تفاصيل الطلب</h4>
                        <p><strong>الاسم الأول:</strong> {selectedRequest.firstName}</p>
                        <p><strong>الاسم الأخير:</strong> {selectedRequest.lastName}</p>
                        <p><strong>تاريخ الميلاد:</strong> {selectedRequest.dateOfBirth}</p>
                        <p><strong>مكان الميلاد:</strong> {selectedRequest.placeOfBirth}</p>
                        <p><strong>رقم الهاتف:</strong> {selectedRequest.phone}</p>
                        <p>
                          <strong>رابط ملف التسجيل:</strong>{" "}
                          <a href={selectedRequest.registrationFileLink} target="_blank" rel="noopener noreferrer">
                            عرض الملف
                          </a>
                        </p>
                        <button
                          className="btn btn-secondary w-100 mt-2"
                          onClick={() => setSelectedRequest(null)}
                        >
                          إغلاق
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : showSettings ? (
              <div>
                <h2 className="text-center mb-4">الإعدادات</h2>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <button
                      className="btn btn-custom w-100"
                      onClick={() => setShowAddGroupModal(true)}
                    >
                      إضافة فوج
                    </button>
                  </div>
                  <div className="col-md-6 mb-3">
                    <button
                      className="btn btn-custom w-100"
                      onClick={() => {}}
                    >
                      تعديل الفوج
                    </button>
                    {groups.length > 0 ? (
                      <div className="mt-3">
                        {groups.map((group, index) => (
                          <div
                            key={index}
                            className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                          >
                            <span>{group}</span>
                            <div>
                              <button
                                className="btn btn-primary btn-sm me-2"
                                onClick={() => handleViewGroupMembers(group)}
                              >
                                عرض المشتركين
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteGroup(group)}
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center mt-3">لا توجد فوج متاحة</p>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <button
                      className="btn btn-custom w-100"
                      onClick={() => setShowEditActivityTimeModal(true)}
                    >
                      تعديل وقت النشاط
                    </button>
                  </div>
                  <div className="col-md-6 mb-3">
                    <button
                      className="btn btn-custom w-100"
                      onClick={() => setShowNotificationModal(true)}
                    >
                      إرسال إشعار
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </main>

        <aside className="col-md-3 sidebar d-flex flex-column align-items-center py-4">
          <button
            className="btn btn-sidebar w-75 mb-3"
            onClick={togglePersonalInfo}
          >
            معلومات شخصية
          </button>
          <button
            className="btn btn-sidebar w-75 mb-3"
            onClick={toggleRequests}
          >
            إدارة الطلبات
          </button>
          <button
            className="btn btn-sidebar w-75 mb-3"
            onClick={toggleSettings}
          >
            الإعدادات
          </button>
          <button
            className="btn btn-sidebar w-75 mb-3"
            onClick={handleLogout}
          >
            تسجيل الخروج
          </button>
        </aside>
      </div>

      {/* نافذة منبثقة لإدخال تفاصيل الاشتراك */}
      <Modal show={showAcceptModal} onHide={() => setShowAcceptModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>إدخال تفاصيل الاشتراك</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleAcceptRequest}>
            <div className="mb-3">
              <label htmlFor="subscriptionDaysStart" className="form-label">
                تاريخ بداية الاشتراك
              </label>
              <DatePicker
                selected={subscriptionDays.start}
                onChange={(date) => setSubscriptionDays({ ...subscriptionDays, start: date })}
                dateFormat="dd/MM/yyyy"
                className="form-control"
                placeholderText="اختر تاريخ البداية"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="subscriptionDaysEnd" className="form-label">
                تاريخ نهاية الاشتراك
              </label>
              <DatePicker
                selected={subscriptionDays.end}
                onChange={(date) => setSubscriptionDays({ ...subscriptionDays, end: date })}
                dateFormat="dd/MM/yyyy"
                className="form-control"
                placeholderText="اختر تاريخ النهاية"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="subscriptionHoursStart" className="form-label">
                بداية الساعات
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
                نهاية الساعات
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
                اختر الفوج
              </label>
              <select
                className="form-control"
                id="groupNumber"
                value={groupNumber}
                onChange={(e) => setGroupNumber(e.target.value)}
                required
              >
                <option value="">اختر الفوج</option>
                {groups.map((group, index) => (
                  <option key={index} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              {groups.length === 0 && (
                <p className="text-danger mt-2">لا توجد فوج متاحة، يرجى إضافتها من الإعدادات.</p>
              )}
            </div>
            <Button variant="primary" type="submit" disabled={groups.length === 0}>
              تأكيد القبول
            </Button>
            <Button
              variant="secondary"
              className="ms-2"
              onClick={() => setShowAcceptModal(false)}
            >
              إلغاء
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* نافذة منبثقة لإضافة فوج */}
      <Modal show={showAddGroupModal} onHide={() => setShowAddGroupModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>إضافة فوج جديد</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="newGroupName" className="form-label">
              اسم الفوج
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
          <Button variant="primary" onClick={handleAddGroup}>
            إضافة
          </Button>
          <Button
            variant="secondary"
            className="ms-2"
            onClick={() => setShowAddGroupModal(false)}
          >
            إلغاء
          </Button>
        </Modal.Body>
      </Modal>

      {/* نافذة منبثقة لعرض المشتركين في فوج */}
      <Modal show={showGroupMembersModal} onHide={() => setShowGroupMembersModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>المشتركون في الفوج</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGroupMembers.length > 0 ? (
            selectedGroupMembers.map((member, index) => (
              <div key={index} className="mb-2 p-2 border rounded">
                <p><strong>الاسم:</strong> {member.firstName} {member.lastName}</p>
                <p><strong>الإيميل:</strong> {member.userEmail}</p>
              </div>
            ))
          ) : (
            <p className="text-center">لا يوجد مشتركون في هذا الفوج</p>
          )}
          <Button
            variant="secondary"
            className="w-100 mt-2"
            onClick={() => setShowGroupMembersModal(false)}
          >
            إغلاق
          </Button>
        </Modal.Body>
      </Modal>

      {/* نافذة منبثقة لتعديل وقت النشاط */}
      <Modal show={showEditActivityTimeModal} onHide={() => setShowEditActivityTimeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>تعديل وقت النشاط</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">إضافة رانج ساعات جديد</label>
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
              إضافة رانج
            </Button>
          </div>
          <div>
            <h5>الرانجات الموجودة:</h5>
            {activityTimeRanges.length > 0 ? (
              activityTimeRanges.map((range, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <p>
                    من {range.start} إلى {range.end}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center">لا توجد رانجات ساعات</p>
            )}
          </div>
          <Button variant="primary" onClick={handleSaveActivityTime}>
            حفظ التغييرات
          </Button>
          <Button
            variant="secondary"
            className="ms-2"
            onClick={() => setShowEditActivityTimeModal(false)}
          >
            إلغاء
          </Button>
        </Modal.Body>
      </Modal>

      {/* نافذة منبثقة لإرسال إشعار */}
      <Modal show={showNotificationModal} onHide={() => setShowNotificationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>إرسال إشعار</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="notificationMessage" className="form-label">
              نص الإشعار
            </label>
            <textarea
              className="form-control"
              id="notificationMessage"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              required
            />
          </div>
          <Button variant="primary" onClick={handleSendNotification}>
            إرسال
          </Button>
          <Button
            variant="secondary"
            className="ms-2"
            onClick={() => setShowNotificationModal(false)}
          >
            إلغاء
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Home2Page;