import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // إضافة useNavigate
import "bootstrap/dist/css/bootstrap.min.css";
import "./LoginPage.css";
import RegisterButton from "./RegisterButton";
import RegisterButton2 from "./registerbutton2";

import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // تهيئة useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // مسح أي أخطاء سابقة

    try {
      // إنشاء المستخدم في Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // تخزين بيانات المستخدم في Firestore مع الاسم ونوع المستخدم
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email: user.email,
        name: name,
        type: "user", // حقل type بقيمة user
        createdAt: new Date(),
      });

      console.log("تم إنشاء الحساب بنجاح:", user);
      alert("تم إنشاء الحساب بنجاح!");
      navigate("/home3"); // إعادة التوجيه إلى /home3 بعد التسجيل
    } catch (err) {
      setError(err.message);
      console.error("خطأ أثناء التسجيل:", err);
    }
  };

  return (
    <div className="login-container d-flex flex-column justify-content-center align-items-center vh-100">
      

      <div className="login-box p-4 rounded shadow mt-3">
        <h2 className="text-center mb-4">Register</h2>
        {error && <p className="text-danger">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control custom-input"
              placeholder="FULL NAME"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="email"
              className="form-control custom-input"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control custom-input"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-custom w-100 mb-3">
            Register 
          </button>
          <div className="text-center mb-3">
            <p className="text-muted mb-1">
            do you have an account?{' '}
              <span
                className="register-link"
                onClick={() => navigate('/login')}
              >
                Login here
              </span>
            </p>
            <p className="text-muted mb-1">
              Or{' '}
              <span
                className="register-link"
                onClick={() => navigate('/registerowner')}
              >
                Register as admin
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;