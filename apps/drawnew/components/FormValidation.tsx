"use client"
import React from 'react';

export interface FormErrors {
    username?: string;
    email?: string;
    password?: string;
}

export interface ValidationRules {
    validateEmail: (email: string) => boolean;
    validatePassword: (password: string) => {
        hasUpperCase: boolean;
        hasLowerCase: boolean;
        hasNumbers: boolean;
        hasSpecialChar: boolean;
        isLongEnough: boolean;
    };
    validateUsername: (username: string) => {
        isLongEnough: boolean;
        isNotTooLong: boolean;
        hasValidChars: boolean;
    };
}

export const useFormValidation = () => {
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
        const isLongEnough = password.length >= 8;

        return {
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar,
            isLongEnough
        };
    };

    const validateUsername = (username: string) => {
        const isLongEnough = username.length >= 3;
        const isNotTooLong = username.length <= 20;
        const hasValidChars = /^[a-zA-Z0-9_]+$/.test(username);

        return {
            isLongEnough,
            isNotTooLong,
            hasValidChars
        };
    };

    const validateField = (name: string, value: string, currentErrors: FormErrors) => {
        const newErrors: FormErrors = { ...currentErrors };

        if (name === 'email' && value) {
            if (!validateEmail(value)) {
                newErrors.email = 'Please enter a valid email address';
            } else {
                delete newErrors.email;
            }
        }

        if (name === 'password' && value) {
            const passwordValidation = validatePassword(value);
            if (!passwordValidation.isLongEnough) {
                newErrors.password = 'Password must be at least 8 characters';
            } else if (!passwordValidation.hasUpperCase || !passwordValidation.hasLowerCase ||
                !passwordValidation.hasNumbers || !passwordValidation.hasSpecialChar) {
                newErrors.password = 'Password must contain uppercase, lowercase, numbers, and special characters';
            } else {
                delete newErrors.password;
            }
        }

        if (name === 'username' && value) {
            const usernameValidation = validateUsername(value);
            if (!usernameValidation.isLongEnough) {
                newErrors.username = 'Username must be at least 3 characters';
            } else if (!usernameValidation.isNotTooLong) {
                newErrors.username = 'Username must be at most 20 characters';
            } else if (!usernameValidation.hasValidChars) {
                newErrors.username = 'Username can only contain letters, numbers, and underscores';
            } else {
                delete newErrors.username;
            }
        }

        return newErrors;
    };

    return {
        validateEmail,
        validatePassword,
        validateUsername,
        validateField
    };
};

export const PasswordRequirements = ({ password }: { password: string }) => {
    if (!password) return null;

    return (
        <div className="text-xs text-gray-400 space-y-1">
            <p className={password.length >= 8 ? 'text-green-500' : ''}>
                • At least 8 characters
            </p>
            <p className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>
                • At least one uppercase letter
            </p>
            <p className={/[a-z]/.test(password) ? 'text-green-500' : ''}>
                • At least one lowercase letter
            </p>
            <p className={/\d/.test(password) ? 'text-green-500' : ''}>
                • At least one number
            </p>
            <p className={/[^A-Za-z0-9]/.test(password) ? 'text-green-500' : ''}>
                • At least one special character
            </p>
        </div>
    );
};
