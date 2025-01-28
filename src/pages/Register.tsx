import { useState, useEffect } from "react";
import { Link } from 'react-router';
import { Signup } from '../components/signup/Signup';

export default function Register() {
    return (
        <>
            <h1>Register</h1>
            <Signup />
        </>
    )
}
