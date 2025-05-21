import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import SignUpOwner from "./components/SignUpOwner";
import Register from "./components/register";
import AuthWrapper from "./components/AuthWrapper";
import ManageRequestsPage from "./components/ManageRequestsPage";
import HomePage from "./components/HomePage"; // الصفحة الرئيسية
import Home2Page from "./components/Home2Page";
import Home3Page from "./components/Home3Page";
import IndividualsPage from "./components/IndividualsPage"; // صفحة الأفراد
import EntitiesPage from "./components/EntitiesPage"; // صفحة الجهات
import NewUserPage from "./components/NewUserPage"; // صفحة مستخدم جديد
import BusinessPage from "./components/BusinessPage"; // صفحة الأعمال
import PlanPage from "./components/PlanPage"; // صفحة الخطة
import SettingsPage from "./components/SettingsPage"; // استيراد صفحة الإعدادات

function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<AuthWrapper />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home3" element={<Home3Page />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/manage-requests" element={<ManageRequestsPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/2home" element={<Home2Page />} />
        <Route path="/individuals" element={<IndividualsPage />} />
        <Route path="/entities" element={<EntitiesPage />} />
        <Route path="/new-user" element={<NewUserPage />} />
        <Route path="/manage-requests" element={<ManageRequestsPage />} />
        <Route path="/business" element={<BusinessPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/registerowner" element={<SignUpOwner />} />
        <Route path="*" element={<h1>الصفحة غير موجودة</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
