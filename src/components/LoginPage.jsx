import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      // signOut(auth)
      // .then(() => {
      //   console.log("User signed out.");
      // })
      // .catch((error) => {
      //   console.error("Sign out error:", error);
      // });
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userQuery = query(
            collection(db, "users"),
            where("uid", "==", user.uid)
          );
          console.log(user.id);
          const userSnapshot = await getDocs(userQuery);

          console.log("📦 Number of documents in users:", userSnapshot.size);

          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userType = userDoc.data().type?.trim();

            switch (userType) {
              case "user":
                console.log('eeeeeeee' + user.id);
                navigate("/home3");
                break;
              case "business":
                navigate("/2home");
                break;
              case "admin":
                navigate("/home");
                break;
              default:
                console.error("Unknown user type:", userType);
                navigate("/home3");
            }
          } else {
            // Search in Activities collection
            const activitiesQuery = query(
              collection(db, "Activities"),
              where("uid", "==", user.uid)
            );
            const activitiesSnapshot = await getDocs(activitiesQuery);

            console.log("📦 Number of documents in Activities:", activitiesSnapshot.size);

            if (!activitiesSnapshot.empty) {
              navigate("/2home");
            } else {
              console.error("User not found in users or Activities");
              navigate("/home3");
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          navigate("/home3");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Logged in:", user.email);

      // Fetch user data from users
      const userQuery = query(
        collection(db, "users"),
        where("uid", "==", user.uid)
      );
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        const userType = userData.type;

        // Redirect based on user type
        if (userType === "user") {
          navigate("/home3");
        } else if (userType === "business") {
          navigate("/2home");
        } else if (userType === "admin") {
          navigate("/home");
        } else {
          console.error("Unknown user type:", userType);
          navigate("/home3");
        }
      } else {
        // Search in Activities collection
        const activitiesQuery = query(
          collection(db, "Activities"),
          where("uid", "==", user.uid)
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);

        if (!activitiesSnapshot.empty) {
          navigate("/2home");
        } else {
          console.error("User data not found in users or Activities");
          navigate("/home3");
        }
      }
    } catch (error) {
      console.error("Error during login:", error.message);
      alert("Login failed: " + error.message);
    }
  };

  // Show loading spinner while checking user status
  if (loading) {
    return (
      <div className="login-container d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container d-flex flex-column justify-content-center align-items-center vh-100">
      <div className="login-box p-4 rounded shadow mt-3">
        <h2 className="text-center mb-4">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="email"
              className="form-control custom-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="password"
              className="form-control custom-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        
          <button type="submit" className="btn btn-custom w-100 mb-3">
            Login
          </button>
          <div className="text-center mb-3">
            <p className="text-muted mb-1">
              Don't have an account?{' '}
              <span
                className="register-link"
                onClick={() => navigate('/register')}
              >
                Register here
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

export default LoginPage;