import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import './SignUpOwner.css';

const SignUpOwner = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cvFile, setCvFile] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const requestData = {
      firstName,
      lastName,
      nationalId,
      birthDate,
      address,
      phoneNumber,
      cvFile,
      status: "pending",
      createdAt: new Date()
    };
  
    try {
      await addDoc(collection(db, "requests"), requestData);
  
      setFirstName('');
      setLastName('');
      setNationalId('');
      setBirthDate('');
      setAddress('');
      setPhoneNumber('');
      setCvFile('');
      
      setSuccessMessage("✅ Request sent successfully. Please wait for approval.");
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("An error occurred while submitting the request.");
    }
  };
  
  return (
    <div className="signup-container">
      <div className="details-card">
        <h2>Register as Activity Owner</h2>
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                className="form-control"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                className="form-control"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nationalId">National ID</label>
              <input
                type="text"
                id="nationalId"
                className="form-control"
                placeholder="National ID"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="birthDate">Birth Date</label>
              <input
                type="date"
                id="birthDate"
                className="form-control"
                placeholder="Birth Date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="address">Email</label>
            <input
              type="email"
              id="address"
              className="form-control"
              placeholder="Email"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              className="form-control"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cvFile">Document (Google Drive)</label>
            <input
              type="url"
              id="cvFile"
              className="form-control"
              placeholder="Required Document"
              value={cvFile}
              onChange={(e) => setCvFile(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Submit Request
          </button>
          <div className="text-center mb-3">
            <p className="text-muted mb-1">
              Already have an account?{' '}
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
                onClick={() => navigate('/register')}
              >
                Register as user
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpOwner;