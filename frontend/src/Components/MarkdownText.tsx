import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Box, Typography } from "@mui/material";

interface MarkdownTextProps {
  title: string;
  transcription: string | null;
  language: string | null;
  audioFileName: string | null;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({
  title,
  transcription,
  language,
  audioFileName,
}) => {
  const [snapshot, setSnapshot] = useState({
    title: "",
    transcription: "",
    language: "",
    audioFileName: "",
  });

  useEffect(() => {
    setSnapshot({
      title: title || "N/A",
      transcription: transcription || "_No transcription available yet._",
      language: language || "N/A",
      audioFileName: audioFileName || "N/A",
    });
  }, [title, transcription, language, audioFileName]);

  const markdownContent = `
# 📑 ${title} Summary

- **Language:** ${snapshot.language}
- **Audio File:** ${snapshot.audioFileName}

**${title}:**  

${snapshot.transcription}
`;

  return (
    <Box
      sx={{
        backgroundColor: "#1e1e1e",
        color: "white",
        padding: 2,
        borderRadius: "8px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        overflowX: "hidden",
        maxWidth: "100%",
      }}
    >
      <ReactMarkdown
        components={{
          h1: (props) => (
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
              sx={{ color: "white" }}
              {...props}
            />
          ),
          ul: (props) => (
            <Box
              component="ul"
              sx={{
                paddingLeft: 2,
                marginBottom: 2,
              }}
              {...props}
            />
          ),
          li: (props) => (
            <Typography
              variant="body1"
              component="li"
              sx={{ fontWeight: 400, color: "white", mb: 0.5 }}
              {...props}
            />
          ),
          strong: (props) => (
            <Typography
              component="span"
              sx={{ fontWeight: "bold", display: "inline", color: "white" }}
              {...props}
            />
          ),
          p: (props) => (
            <Typography
              variant="body2"
              sx={{ fontWeight: 300, color: "white", marginBottom: 1 }}
              {...props}
            />
          ),
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownText;
