import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Typography, IconButton } from "@mui/material";
import Button from "@mui/material/Button";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import DeleteIcon from "@mui/icons-material/Delete";

interface AudioDropzoneProps {
  onFileAccepted: (file: File | null) => void;
  fileName?: string | null;
}

const AudioDropzone: React.FC<AudioDropzoneProps> = ({
  onFileAccepted,
  fileName,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onFileAccepted(file);
      }
    },
    [onFileAccepted],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".aac", ".ogg"],
    },
    multiple: false,
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileAccepted(null);
  };

  const displayName = fileName
    ? fileName.length > 15
      ? `${fileName.slice(0, 15)}...`
      : fileName
    : null;

  return (
    <Button
      variant="contained"
      {...getRootProps()}
      sx={{
        flex: 1,
        width: "100%",
        border: "1px dashed white",
        borderRadius: "8px",
        textAlign: "center",
        textTransform: "none",
        py: 2,
        px: 3,
        cursor: "pointer",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        transition: "0.5s",
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
      {displayName ? (
        <>
          <Typography variant="body1" noWrap>
            {displayName}
          </Typography>
          <IconButton
            size="small"
            onClick={handleClear}
            sx={{ color: "white" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ) : (
        <Typography
          variant="body1"
          display="flex"
          alignItems="center"
          gap={0.5}
        >
          <MusicNoteIcon fontSize="small" />
          {isDragActive
            ? "Drop audio here..."
            : "Upload or drop audio file here"}
        </Typography>
      )}
    </Button>
  );
};

export default AudioDropzone;
