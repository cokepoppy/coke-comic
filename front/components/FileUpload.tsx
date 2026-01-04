import React, { useRef, useState } from 'react';
import { Upload, X, File as FileIcon, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  label: string;
  multiple?: boolean;
  accept?: string;
  onChange: (files: File[]) => void;
  files: File[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  multiple = false, 
  accept = "image/*", 
  onChange,
  files 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Array.from on FileList can return unknown[], so we cast to File[]
      const droppedFiles = Array.from(e.dataTransfer.files) as File[];
      handleNewFiles(droppedFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Array.from on FileList can return unknown[], so we cast to File[]
      const selectedFiles = Array.from(e.target.files) as File[];
      handleNewFiles(selectedFiles);
    }
  };

  const handleNewFiles = (newFiles: File[]) => {
    if (multiple) {
      // Append for multiple
      onChange([...files, ...newFiles]);
    } else {
      // Replace for single
      onChange([newFiles[0]]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    onChange(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div 
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer text-center group
          ${isDragging 
            ? 'border-[#1a73e8] bg-blue-50' 
            : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInput}
        />
        
        <div className="flex flex-col items-center pointer-events-none">
          <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
            <Upload className={`w-6 h-6 ${isDragging ? 'text-[#1a73e8]' : 'text-gray-500'}`} />
          </div>
          <p className="text-sm font-medium text-gray-700">
            {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {multiple ? `PNG, JPG (Multiple files allowed)` : 'PNG, JPG (Max 5MB)'}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {files.map((file, index) => (
            <FileItem key={`${file.name}-${index}`} file={file} onRemove={() => removeFile(index)} />
          ))}
        </div>
      )}
    </div>
  );
};

interface FileItemProps {
  file: File;
  onRemove: () => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onRemove }) => (
  <div className="flex items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm group hover:border-[#1a73e8]/50 transition-colors">
    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
      {file.type.startsWith('image/') ? (
        <ImageIcon className="w-5 h-5 text-gray-500" />
      ) : (
        <FileIcon className="w-5 h-5 text-gray-500" />
      )}
    </div>
    <div className="flex-1 min-w-0 text-left">
      <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
        {file.name}
      </p>
      <p className="text-xs text-gray-500">
        {(file.size / 1024).toFixed(1)} KB
      </p>
    </div>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="p-1.5 ml-2 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
      title="Remove file"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);