"use client";
import React, { useState } from 'react'
import { Shield, LogOut } from 'lucide-react'
import { logOutAction } from '@/app/actions/auth'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation';
import useUserStore from '@/app/store/useStore';


function UpperNavbar() {

    const currentUser = useUserStore((state) => state.currentUser)
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogout = async() => {
        try {
            setLoading(true);
            const res = await logOutAction();
            if(res.success) {
                router.push('/');
                toast.success("Logout Successfully")
            }
        } catch (error) {
            console.log(error)
            toast.error("Unable to Logout")
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='w-full flex justify-between items-center py-4 px-40 bg-white border-b-2 border-gray-200'>
            <div className='text-2xl flex items-center space-x-4 font-semibold font-serif cursor-pointer' onClick={() => router.push("/")}>
                <Shield className='text-teal-500' /> MediLink
            </div>
            <div className='flex items-center space-x-4'>
                <span className='text-gray-500 mr-10'> {currentUser?.personalInfo.email} </span>
                <LogOut
                    size={20}
                    className='mr-2 cursor-pointer hover:text-red-500'
                    onClick={handleLogout}
                />  Sign Out
            </div>
        </div>
    )
}

export default UpperNavbar