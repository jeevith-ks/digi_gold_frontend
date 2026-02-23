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
        title: ''
    });

    const timerRef = useRef(null);

    const hideAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, show: false }));
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const showAlert = useCallback((message, type = 'info', title = '') => {
        // Clear existing timer if any
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        setAlert({
            show: true,
            message,
            type,
            title: title || (type.charAt(0).toUpperCase() + type.slice(1))
        });

        // Auto hide after 5 seconds
        timerRef.current = setTimeout(() => {
            hideAlert();
        }, 5000);
    }, [hideAlert]);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alert.show && (
                <CustomAlert
                    message={alert.message}
                    type={alert.type}
                    title={alert.title}
                    onClose={hideAlert}
                />
            )}
        </AlertContext.Provider>
    );
};
