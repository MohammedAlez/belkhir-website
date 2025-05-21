import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, query, where } from 'firebase/firestore';
import { auth, db } from "../firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import "./HomePage.css";

const ManageRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'requests'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
    } catch (error) {
      console.error("خطأ أثناء جلب الطلبات:", error);
      setErrorMessage("فشل جلب الطلبات، يرجى المحاولة لاحقاً.");
    }
  };

  const handleReject = async (request) => {
    try {
      if (!request.userId) {
        throw new Error("معرف المستخدم غير متوفر في الطلب.");
      }

      const userQuery = query(
        collection(db, "users"),
        where("uid", "==", request.userId)
      );
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDocId = userSnapshot.docs[0].id;
        await addDoc(collection(db, `users/${userDocId}/notifications`), {
          message: `تم رفض طلبك: ${request.firstName} ${request.lastName}`,
          createdAt: new Date(),
        });
      }

      await deleteDoc(doc(db, 'requests', request.id));
      setRequests(requests.filter(req => req.id !== request.id));
      setSelectedRequest(null);
    } catch (error) {
      console.error("خطأ أثناء رفض الطلب:", error);
      setErrorMessage(`فشل رفض الطلب: ${error.message}`);
    }
  };

  const handleAccept = async (request) => {
    try {
      if (!request.firstName || !request.lastName || !request.nationalId) {
        throw new Error("الاسم الأول، الاسم الأخير، أو رقم الهوية مفقود.");
      }

      const timestamp = Date.now();
      const email = `${request.firstName.toLowerCase()}.${timestamp}@site.com`;
      const password = generateRandomPassword();

      const activityQuery = query(
        collection(db, "Activities"),
        where("email", "==", email)
      );
      const activitySnapshot = await getDocs(activityQuery);
      if (!activitySnapshot.empty) {
        throw new Error("البريد الإلكتروني مستخدم بالفعل.");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await addDoc(collection(db, 'Activities'), {
        firstName: request.firstName,
        lastName: request.lastName,
        nationalId: request.nationalId,
        address: request.address || "",
        phoneNumber: request.phoneNumber || "",
        birthDate: request.birthDate || "",
        cvFile: request.cvFile || "",
        email,
        createdAt: new Date(),
        uid: user.uid,
        password: password
      });

      if (request.userId) {
        const userQuery = query(
          collection(db, "users"),
          where("uid", "==", request.userId)
        );
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userDocId = userSnapshot.docs[0].id;
          await addDoc(collection(db, `users/${userDocId}/notifications`), {
            message: `تم قبول طلبك: ${request.firstName} ${request.lastName}`,
            createdAt: new Date(),
          });
        }
      }

      await deleteDoc(doc(db, 'requests', request.id));
      setRequests(requests.filter(req => req.id !== request.id));
      setSelectedRequest(null);
      alert(`تم إنشاء الحساب بنجاح:\nالبريد: ${email}\nكلمة المرور: ${password}`);
    } catch (error) {
      console.error("خطأ أثناء قبول الطلب:", error);
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("البريد الإلكتروني مستخدم بالفعل، يرجى المحاولة مرة أخرى.");
      } else {
        setErrorMessage(`فشل قبول الطلب: ${error.message}`);
      }
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const RequestDetailsModal = ({ request, onClose }) => {
    return (
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div className="details-card mb-2" style={{
          backgroundColor: 'white',
          padding: '50px',
          borderRadius: '8px',
          width: '400px',
          maxWidth: '90%',
          maxHeight: '80vh',
          overflowY: 'auto', 
          marginBottom:'20px'
        }}>
          
          <h3>تفاصيل الطلب</h3>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={`${request.firstName} ${request.lastName}`}
              disabled
            />
          </div>
          <div className="form-group">
            <label>National Id</label>
            <input
              type="text"
              value={request.nationalId || "غير متوفر"}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              value={request.address || "غير متوفر"}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              value={request.phoneNumber || "غير متوفر"}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Brith Date</label>
            <input
              type="text"
              value={request.birthDate || "غير متوفر"}
              disabled
            />
          </div>
          {request.cvFile && (
            <div className="form-group">
              <label>CV </label>
              <a
                href={request.cvFile}
                target="_blank"
                rel="noreferrer"
                className="cv-link"
              >
                  show file
              </a>
            </div>
          )}
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ width: '100%', marginTop: '10px' }}
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="manage-requests-section w-full">
      {/* <h2>إدارة الطلبات</h2> */}
      {/* <h2>Manage Requests</h2> */}
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      {requests.length === 0 ? (
        <p>There's no requests yet</p>
        // <p>لا توجد طلبات حالياً</p>
      ) : (
        requests.map((req) => (
          <div key={req.id} className="details-card min-w-full">
            <div className=" items-center justify-between flex">
              <strong className='font-bold text-xl'>{req.firstName} {req.lastName}</strong>
              <div className="flex  gap-3">
                <button
                  className="w-fit bg-gray-200 p-2 rounded-lg font-medium "
                  onClick={() => setSelectedRequest(req)}
                >
                  Preview
                </button>
                <button
                  className="w-fit bg-green-500 hover:bg-green-600 p-2 rounded-lg font-medium text-white"
                  onClick={() => handleAccept(req)}
                >
                  Accept 
                </button>
                <button
                  className="w-fit bg-red-500 hover:bg-red-600 p-2 rounded-lg font-medium text-white"
                  onClick={() => handleReject(req)}
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

export default ManageRequestsPage;