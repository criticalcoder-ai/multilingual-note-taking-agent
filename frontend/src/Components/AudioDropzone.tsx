import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface AudioDropzoneProps {
  onFileAccepted: (file: File | null) => void;
}

const AudioDropzone: React.FC<AudioDropzoneProps> = ({ onFileAccepted }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const trimmedName = file.name.length > 15 ? `${file.name.slice(0, 15)}...` : file.name;
      setFileName(trimmedName);
      onFileAccepted(file);
    }
  }, [onFileAccepted]);

  const handleClear = () => {
    setFileName(null);
    onFileAccepted(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg'],
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
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
      {fileName ? (
        <>
          <Typography variant="body1" noWrap>
            {fileName}
          </Typography>
          <IconButton size="small" onClick={handleClear} sx={{ color: 'white' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ) : (
        <Typography variant="body1">
          {isDragActive ? 'Drop the audio here...' : 'Upload or drop audio file here'}
        </Typography>
      )}
    </Box>
  );
};

export default AudioDropzone;
