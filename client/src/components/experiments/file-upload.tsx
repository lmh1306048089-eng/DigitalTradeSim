import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  experimentId?: string;
  resultId?: string;
  onUploadComplete?: (file: any) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export function FileUpload({ 
  experimentId, 
  resultId, 
  onUploadComplete,
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'image/*': ['.jpeg', '.jpg', '.png', '.gif']
  },
  maxSize = 10 * 1024 * 1024 // 10MB
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadFile(file);
    }
  }, [experimentId, resultId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: true,
  });

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (experimentId) formData.append('experimentId', experimentId);
      if (resultId) formData.append('resultId', resultId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await apiRequest('POST', '/api/upload', formData);
      const uploadedFile = await response.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadedFiles(prev => [...prev, uploadedFile]);
      onUploadComplete?.(uploadedFile);

      toast({
        title: "上传成功",
        description: `文件 ${file.name} 已成功上传`,
      });
    } catch (error: any) {
      toast({
        title: "上传失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-4" data-testid="file-upload">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          dropzone border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'drag-over' : ''}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        data-testid="dropzone"
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          {isDragActive ? "松开鼠标完成上传" : "拖拽文件到此处或点击上传"}
        </p>
        <Button variant="outline" type="button" data-testid="upload-button">
          选择文件
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          支持 PDF、DOC、DOCX、JPG、PNG 格式，单个文件最大 10MB
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2" data-testid="upload-progress">
          <div className="flex items-center justify-between text-sm">
            <span>上传中...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2" data-testid="uploaded-files">
          <h4 className="font-medium text-sm">已上传文件</h4>
          {uploadedFiles.map((file) => (
            <div 
              key={file.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
              data-testid={`uploaded-file-${file.id}`}
            >
              <div className="flex items-center space-x-3">
                <File className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-secondary" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  data-testid={`remove-file-${file.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
