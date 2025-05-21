import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase"; // تأكد من المسار الصحيح لـ firebase.js
import { doc, getDoc } from "firebase/firestore";

const AuthWrapper = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // المستخدم مسجل، جلب نوع المستخدم من Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userType = userData.type;

            // إعادة التوجيه بناءً على نوع المستخدم
            if (userType === "user") {
              navigate("/home3");
            } else if (userType === "business") {
              navigate("/2home");
            } else if (userType === "admin") {
              navigate("/home");
            } else {
              console.error("نوع المستخدم غير معروف:", userType);
              navigate("/home3"); // الافتراضي إذا لم يكن النوع معروفًا
            }
          } else {
            console.error("لم يتم العثور على بيانات المستخدم في Firestore");
            navigate("/home3"); // الافتراضي إذا لم يتم العثور على المستند
          }
        } catch (error) {
          console.error("خطأ أثناء جلب بيانات المستخدم:", error);
          navigate("/home3"); // الافتراضي في حالة الخطأ
        }
      } else {
        // المستخدم غير مسجل
        navigate("/login");
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (checkingAuth) {
    return <div className="text-center mt-5">جاري التحقق من تسجيل الدخول...</div>;
  }

  return null;
};

export default AuthWrapper;