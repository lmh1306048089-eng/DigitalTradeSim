import React, { useState } from "react";
import { Upload, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SimpleFileUploadProps {
  label: string;
  description: string;
  accept: string;
  maxFiles: number;
  onFilesChange: (files: File[]) => void;
  "data-testid"?: string;
}

export function SimpleFileUpload({ 
  label, 
  description, 
  accept, 
  maxFiles, 
  onFilesChange,
  "data-testid": testId 
}: SimpleFileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const limitedFiles = selectedFiles.slice(0, maxFiles);
    setFiles(limitedFiles);
    onFilesChange(limitedFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <div className="flex flex-col items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById(`file-input-${testId}`)?.click()}
            >
              选择文件
            </Button>
            <p className="text-xs text-gray-500">
              最多{maxFiles}个文件，支持的格式：{accept}
            </p>
          </div>
          <input
            id={`file-input-${testId}`}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleFileChange}
            className="hidden"
            data-testid={testId}
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
            >
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(file.size / 1024)} KB)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}