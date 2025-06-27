import React from 'react'
import { RxCross1 } from "react-icons/rx";
const GoogleDrive = ({setgoogledrive}) => {
    

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
            <div onClick={()=>setgoogledrive(false)} className='flex justify-end cursor-pointer hover:text-orange-500 transition-all duration-200'>
                    <RxCross1 size={20} />
            </div>
          </div>
        </div>
  )
}

export default GoogleDrive