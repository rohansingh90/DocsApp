import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdCloudUpload } from "react-icons/md";

const FileUploadPopup = ({ isUploading, fileName, onUploadComplete }) => {
  return (
    <AnimatePresence>
      {isUploading && (
        <motion.div
          className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 shadow-lg rounded-lg p-4 w-80 z-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="text-orange-500"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <MdCloudUpload size={24} />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                Uploading {fileName || "item"}...
              </p>
              <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  onAnimationComplete={onUploadComplete}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FileUploadPopup;