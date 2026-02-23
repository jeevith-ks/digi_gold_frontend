'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import CustomAlert from '../components/CustomAlert';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({
        show: false,
        message: '',
        type: 'info',
        title: '',
        isConfirm: false,
        resolve: null
    });

    const timerRef = useRef(null);

    const hideAlert = useCallback((result = false) => {
        if (alert.resolve) {
            alert.resolve(result);
        }
        setAlert(prev => ({ ...prev, show: false, resolve: null }));
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, [alert.resolve]);

    const showAlert = useCallback((message, type = 'info', title = '') => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        setAlert({
            show: true,
            message,
            type,
            title: title || (type.charAt(0).toUpperCase() + type.slice(1)),
            isConfirm: false,
            resolve: null
        });

        if (type !== 'confirm') {
            timerRef.current = setTimeout(() => {
                hideAlert();
            }, 5000);
        }
    }, [hideAlert]);

    const showConfirm = useCallback((message, title = 'Confirm') => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        return new Promise((resolve) => {
            setAlert({
                show: true,
                message,
                type: 'confirm',
                title,
                isConfirm: true,
                resolve
            });
        });
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm, hideAlert }}>
            {children}
            {alert.show && (
                <CustomAlert
                    message={alert.message}
                    type={alert.type}
                    title={alert.title}
                    onClose={() => hideAlert(false)}
                    onConfirm={() => hideAlert(true)}
                    isConfirm={alert.isConfirm}
                />
            )}
        </AlertContext.Provider>
    );
};
