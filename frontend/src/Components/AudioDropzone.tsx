import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography } from '@mui/material';

interface AudioDropzoneProps {
  onFileAccepted: (file: File) => void;
}

const AudioDropzone: React.FC<AudioDropzoneProps> = ({ onFileAccepted }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg']
    },
    multiple: false,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        flex: 1,
        border: '1px dashed white',
        borderRadius: '8px',
        textAlign: 'center',
        py: 2,
        px: 3,
        cursor: 'pointer',
        color: 'white',
        transition: '0.2s',
        '&:hover': {
          backgroundColor: 'green',
          color: 'white',
        },
        ...(isDragActive && {
          backgroundColor: '#2e7d32',
          borderColor: 'lime',
        }),
      }}
    >
      <input {...getInputProps()} />
      <Typography variant="body1">
        {isDragActive ? 'Drop the audio here...' : 'Upload or drag and drop audio file'}
      </Typography>
    </Box>
  );
};

export default AudioDropzone;
