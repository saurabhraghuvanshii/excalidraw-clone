"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useFormValidation } from '@/components/FormValidation';

export function AuthPage({ type }: { type: "signup" | "signin" }) {
    const router = useRouter();
    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [validationErrors, setValidationErrors] = useState({
        email: "",
        username: "",
        password: ""
    });

    const { validateEmail, validatePassword, validateUsername, validateField } = useFormValidation();

    useEffect(() => {
        if (type === "signup") {
            const newErrors = {
                email: validateField("email", emailOrUsername, validationErrors).email || "",
                username: validateField("username", username, validationErrors).username || "",
                password: validateField("password", password, validationErrors).password || ""
            };
            setValidationErrors(newErrors);
        }
    }, [emailOrUsername, username, password, type]);

    // Get message from URL (like "Signup success")
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const msg = params.get("message");
        if (msg) {
            setMessage(msg);
        }
    }, []);

    // Helper to decode JWT payload (client-side, no verification)
    function decodeJwt(token: string): { exp?: number } {
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return decoded;
        } catch {
            return {};
        }
    }

    // Redirect if already signed in
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const decoded = decodeJwt(token);
            if (decoded.exp && decoded.exp * 1000 > Date.now()) {
                const roomId = generateRoomId();
                router.replace(`/canvas/${roomId}`);
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            let data;
            if (type === "signup") {
                if (!validateEmail(emailOrUsername) || !validatePassword(password).isLongEnough || !validateUsername(username).isLongEnough) {
                    setError("Please check your inputs");
                    return;
                }
                data = {
                    type: "signup",
                    email: emailOrUsername,
                    password,
                    username,
                    name
                };
            } else {
                if (!emailOrUsername || !password) {
                    setError("Please fill in all fields");
                    return;
                }
                data = {
                    type: "signin",
                    emailOrUsername,
                    password
                };
            }

            const response = await axios.post("/api/auth", data);
            if (type === "signup") {
                router.push("/signin?message=Signup successful. Please log in.");
            } else {
                localStorage.setItem("token", response.data.token);
                const roomId = generateRoomId();
                router.push(`/canvas/${roomId}`);
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || `${type} failed`);
            } else {
                setError(`${type} failed`);
            }
        }
    };

    const generateRoomId = () => {
        return Math.random().toString(36).substring(2, 15);
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        {type === "signup" ? "Create your account" : "Sign in to your account"}
                    </h2>
                </div>

                {/* Show signup success message */}
                {message && (
                    <div className="text-green-500 text-sm text-center">{message}</div>
                )}

                {/* Show error */}
                {error && (
                    <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="emailOrUsername" className="sr-only">
                                {type === "signup" ? "Email" : "Email or Username"}
                            </label>
                            <input
                                id="emailOrUsername"
                                name="emailOrUsername"
                                type={type === "signup" ? "email" : "text"}
                                required
                                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${type === "signup" && validationErrors.email ? "border-red-500" : "border-gray-700"
                                    } bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                placeholder={type === "signup" ? "Email address" : "Email or Username"}
                                value={emailOrUsername}
                                onChange={(e) => setEmailOrUsername(e.target.value)}
                            />
                            {type === "signup" && validationErrors.email && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                            )}
                        </div>

                        {type === "signup" && (
                            <div>
                                <label htmlFor="username" className="sr-only">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${validationErrors.username ? "border-red-500" : "border-gray-700"
                                        } bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                {validationErrors.username && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.username}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${type === "signup" && validationErrors.password ? "border-red-500" : "border-gray-700"
                                    } bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {type === "signup" && validationErrors.password && (
                                <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                            )}
                        </div>

                        {type === "signup" && (
                            <div>
                                <label htmlFor="name" className="sr-only">
                                    Name (Optional)
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-700 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Name (Optional)"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {type === "signup" ? "Sign Up" : "Sign In"}
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-gray-400">
                            {type === "signup" ? "Already have an account? " : "Don't have an account? "}
                            <Link
                                href={type === "signup" ? "/signin" : "/signup"}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                {type === "signup" ? "Sign in" : "Sign up"}
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
}
