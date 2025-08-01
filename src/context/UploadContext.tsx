// contexts/UploadContext.tsx
import React, {createContext, useContext, useState} from 'react';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadContextProps {
  backgroundStatus: UploadStatus;
  backgroundProgress: number;
  backgroundUploadMessage: string;
  setBackgroundStatus: (status: UploadStatus) => void;
  setBackgroundProgress: (progress: number) => void;
  setBackgroundUploadMessage: (message: string) => void;
}

const UploadContext = createContext<UploadContextProps>({
  backgroundStatus: 'idle',
  backgroundProgress: 0,
  backgroundUploadMessage: '',
  setBackgroundStatus: () => {},
  setBackgroundProgress: () => {},
  setBackgroundUploadMessage: () => {},
});

export const useUploadContext = () => useContext(UploadContext);

export const UploadProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [backgroundStatus, setBackgroundStatus] =
    useState<UploadStatus>('idle');
  const [backgroundProgress, setBackgroundProgress] = useState<number>(0);
  const [backgroundUploadMessage, setBackgroundUploadMessage] =
    useState<string>('');

  return (
    <UploadContext.Provider
      value={{
        backgroundStatus,
        backgroundProgress,
        backgroundUploadMessage,
        setBackgroundStatus,
        setBackgroundProgress,
        setBackgroundUploadMessage,
      }}>
      {children}
    </UploadContext.Provider>
  );
};
