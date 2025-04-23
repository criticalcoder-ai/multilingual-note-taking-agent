import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface AudioDropzoneProps {
  onFileAccepted: (file: File | null) => void;
  fileName?: string | null;
}

const AudioDropzone: React.FC<AudioDropzoneProps> = ({ onFileAccepted, fileName }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onFileAccepted(file);
      }
    },
    [onFileAccepted]
  );

  const handleClear = () => {
    onFileAccepted(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".aac", ".ogg"],
    },
    multiple: false,
  });

  const trimmedName = fileName
    ? fileName.length > 15
      ? `${fileName.slice(0, 15)}...`
      : fileName
    : null;

  return (
    <Box
      {...getRootProps()}
      sx={{
        flex: 1,
        border: "1px dashed white",
        borderRadius: "8px",
        textAlign: "center",
        py: 2,
        px: 3,
        cursor: "pointer",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        transition: "0.2s",
        "&:hover": {
          backgroundColor: "green",
          color: "white",
        },
        ...(isDragActive && {
          backgroundColor: "#2e7d32",
          borderColor: "lime",
        }),
      }}
    >
      <input {...getInputProps()} />
      {trimmedName ? (
        <>
          <Typography variant="body1" noWrap>
            {trimmedName}
          </Typography>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation(); 
              handleClear();}
            } 
            sx={{ color: "white" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ) : (
        <Typography variant="body1">
          {isDragActive ? "Drop the audio here..." : "Upload or drop audio file here"}
        </Typography>
      )}
    </Box>
  );
};

export default AudioDropzone;
