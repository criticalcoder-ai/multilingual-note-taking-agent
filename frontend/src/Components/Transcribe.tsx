import { styled, useTheme } from "@mui/material/styles";
import { useState, useEffect } from "react";
import ReplayIcon from "@mui/icons-material/Replay";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import ListItemText from "@mui/material/ListItemText";
import AddCommentIcon from "@mui/icons-material/AddComment";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";
import MailIcon from "@mui/icons-material/Mail";
import ExportPdfButton from "./ExportPDF";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Tabs, Tab, Box } from "@mui/material";
import axios from "axios";

import { copyToClipboard } from "../utils";
import LanguageDropdown from "./Dropdown";
import ModelDropdown from "./Dropdown";
import AudioDropzone from "./AudioDropzone";
import Autoselect from "./Autoselect";
import MarkdownText from "./MarkdownText";

interface Session {
  id: number;
  session_name: string;
  query_lang: string;
  query_prompt: string;
  created_time: string;
  query_file: string;
  query_audio_kind: string;
}

interface TranscriptionResponse {
  notes: string;
  transcription: string;
}

const drawerWidth = 250;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  variants: [
    {
      props: ({ open }) => open,
      style: {
        transition: theme.transitions.create("margin", {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
      },
    },
  ],
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(["margin", "width"], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const languageOptions = [
  { label: "English (Default)", value: "english" },
  { label: "Mandarin (Traditional)", value: "mandarin" },
  { label: "Simplified Chinese", value: "simplified_chinese" },
  { label: "French", value: "french" },
  { label: "Spanish", value: "spanish" },
  { label: "Portuguese", value: "portuguese" },
  { label: "Japanese", value: "japanese" },
  { label: "German", value: "german" },
];

const modelOptions = [
  { label: "Deepseek (Default", value: "deepseek" },
  { label: "Open AI", value: "openai" },
  { label: "Qwen", value: "qwen" },
  { label: "Gemini", value: "gemini" },
];

export default function PersistentDrawerLeft() {
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const theme = useTheme();
  const navigate = useNavigate();

  const { sessionId } = useParams({ strict: false }) || { sessionId: "1" };
  const [isEditingName, setIsEditingName] = useState(false);
  const [sessionName, setSessionName] = useState(sessionId || "New Session");

  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [selectedModel, setSelectedModel] = useState<string>("openai");
  const [prompt, setPrompt] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>("");
  const [sendState, setSendState] = useState(true);
  const [transcriptionData, setTranscriptionData] =
    useState<TranscriptionResponse | null>(null);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  // API Endpoints:
  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["audio-sessions"],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_URL}/api/audio-sessions/`);

        if (!Array.isArray(res.data)) {
          throw new Error("Invalid response format: expected array");
        }

        return res.data;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          throw new Error(err.response?.data?.message || err.message);
        }
        throw err;
      }
    },
  });

  const newSession = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/audio-sessions/new`);
      const newSessionId = res.data;
      console.log("New session created with ID:", newSessionId);

      // Navigate to new chat page with that session ID
      navigate({ to: `/chat/${newSessionId}` });
    } catch (error) {
      console.error("Error creating new session: ", error);
    }
  };

  useEffect(() => {
    if (sessions.length > 0 && sessionId) {
      const session = sessions.find(
        (s: Session) => s.id.toString() === sessionId,
      );
      if (session) {
        setSessionName(session.session_name);
        setSelectedLanguage(session.query_lang.toLowerCase());
        setPrompt(session.query_prompt);
        setAudioFileName(session.query_file);

        // If this session already has data, show the transcription/notes tabs
        if (session.transcription || session.notes) {
          setTranscriptionData({
            transcription: session.transcription || "",
            notes: session.notes || "",
          });
        }
      }
    }
  }, [sessions, sessionId]);

  const filteredChats = sessions.filter((session: Session) =>
    session.session_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCopy = async () => {
    if (!transcriptionData) return;

    const textToCopy =
      activeTab === 0
        ? transcriptionData.transcription
        : transcriptionData.notes;
    const success = await copyToClipboard(textToCopy);
    console.log(success ? "Text copied to clipboard!" : "Failed to copy text.");
  };

  const handleSendRequest = async () => {
    const tagsString = selectedTags.join(", ");

    if (!audioFile) {
      window.alert("Please upload an audio file!");
      return;
    }

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("session_name", sessionName);
    formData.append("file", audioFile);
    formData.append("query_prompt", prompt);
    formData.append("query_lang", selectedLanguage);
    formData.append("query_file", audioFileName);
    formData.append("query_audio_kind", tagsString);

    console.log("Sending payload:", formData);

    setIsLoadingResponse(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/audio-sessions/send`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.status === 200) {
        console.log("Request successful:", res.data);
        setTranscriptionData({
          transcription: res.data.transcription || "",
          notes: res.data.notes || "",
        });
        setSendState(false);
      } else {
        console.error("Unexpected response:", res);
      }
    } catch (error) {
      console.error("Error sending request:", error);
      window.alert("Error sending request!");
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  if (isLoading) {
    return <Typography>Loading sessions...</Typography>;
  }

  if (isError) {
    return <Typography>Error fetching sessions. {error?.message}</Typography>;
  }

  return (
    <Box
      sx={{
        display: "flex",
      }}
    >
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                mr: 2,
              },
              open && { display: "none" },
            ]}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Voice AI - Transcribe
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ minWidth: 150, ml: "auto" }}>
            <ModelDropdown
              title="Model"
              options={modelOptions}
              value={selectedModel}
              onChange={(val) => setSelectedModel(val)}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: theme.spacing(0, 1),
            ...theme.mixins.toolbar,
          }}
        >
          <Button
            sx={{
              alignSelf: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingX: 1,
              paddingY: 1,
              margin: 0,
              cursor: "pointer",
              color: "black",
              "&:hover": {
                backgroundColor: "black",
                color: "white",
              },
            }}
            onClick={() => {
              newSession();
            }}
          >
            <AddCommentIcon />
          </Button>

          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </DrawerHeader>

        <Divider />

        <Box sx={{ padding: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              backgroundColor: "white",
              borderRadius: 1,
            }}
          />
        </Box>

        <List
          sx={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {filteredChats.length > 0 ? (
            filteredChats.map((session: Session) => (
              <ListItem key={session.id} disablePadding>
                <ListItemButton
                  onClick={() => navigate({ to: `/chat/${session.id}` })}
                >
                  <ListItemIcon>
                    <MailIcon />
                  </ListItemIcon>
                  <ListItemText primary={session.session_name} />
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No results found." />
            </ListItem>
          )}
        </List>
      </Drawer>

      <Main open={open} sx={{ height: "100%" }}>
        <DrawerHeader />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          {isEditingName ? (
            <TextField
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                input: { color: "black", fontWeight: 600, fontSize: "1.25rem" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "black",
                  },
                  "&:hover fieldset": {
                    borderColor: "black",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "black",
                  },
                },
              }}
            />
          ) : (
            <Typography
              sx={{ color: "black" }}
              fontSize="1.5rem"
              fontWeight="bold"
            >
              {sessionName}
            </Typography>
          )}

          <IconButton
            onClick={() => {
              if (isEditingName) {
                // Call an API to update session_name in backend here if needed
                // e.g. axios.post(`${API_URL}/api/audio-sessions/${sessionId}/rename`, { session_name: sessionName })
              }
              if ((sessionName === "" || null) && isEditingName === true) {
                window.alert("Please enter a valid session name!");
                return;
              }
              setIsEditingName(!isEditingName);
            }}
            size="small"
            sx={{
              color: "black",
              border: "1px solid black",
              borderRadius: 1,
              padding: "4px",
            }}
          >
            {isEditingName ? (
              <CheckIcon fontSize="small" />
            ) : (
              <EditIcon fontSize="small" />
            )}
          </IconButton>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 2,
            border: "1px solid white",
            borderRadius: "8px",
            backgroundColor: "primary.main",
            color: "white",
          }}
        >
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
          >
            <Box sx={{ flex: 1 }}>
              <AudioDropzone
                fileName={audioFileName}
                onFileAccepted={(file) => {
                  if (file) {
                    setAudioFileName(file.name);
                    setAudioFile(file);
                    console.log("Accepted file:", file);
                  } else {
                    setAudioFileName("");
                    setAudioFile(null);
                    console.log("File removed");
                  }
                }}
              />
            </Box>

            <Box
              sx={{
                flex: 1,
                border: "1px dashed white",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                paddingX: 2,
                paddingY: 1.5,
                color: "white",
                backgroundColor: "primary.main",
                minHeight: "56px",
              }}
            >
              <LanguageDropdown
                title="Language"
                options={languageOptions}
                value={selectedLanguage}
                onChange={(val) => setSelectedLanguage(val)}
              />
            </Box>
          </Box>

          <Autoselect
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />

          <Box
            component="textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here:"
            rows={4}
            sx={{
              width: "100%",
              backgroundColor: "black",
              color: "white",
              border: "1px solid white",
              borderRadius: "8px",
              padding: 1,
              resize: "none",
            }}
          />

          <Button
            variant="outlined"
            onClick={handleSendRequest}
            disabled={isLoadingResponse}
            sx={{
              alignSelf: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid white",
              borderRadius: "8px",
              paddingX: 4,
              paddingY: 1,
              cursor: "pointer",
              color: "white",
              "&:hover": {
                backgroundColor: "green",
              },
              "&:disabled": {
                opacity: 0.7,
                cursor: "not-allowed",
              },
            }}
          >
            {isLoadingResponse ? (
              <>Loading...</>
            ) : sendState ? (
              <>
                <SendIcon sx={{ marginRight: 1 }} />
                Send
              </>
            ) : (
              <>
                <ReplayIcon sx={{ marginRight: 1 }} />
                Retry
              </>
            )}
          </Button>
        </Box>

        <Box
          sx={{
            marginTop: 4,
            border: "1px solid white",
            borderRadius: "8px",
            backgroundColor: "#1e1e1e",
            color: "white",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              top: 10,
              right: 10,
              borderRadius: "5px",
              padding: 1,
              margin: 2,
              fontSize: "0.85rem",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                textColor="inherit"
                indicatorColor="primary"
                aria-label="transcription and notes tabs"
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Tab label="Transcription" />
                <Tab label="Notes" />
              </Tabs>

              <IconButton
                onClick={handleCopy}
                aria-label="copy"
                sx={{ color: (theme) => theme.palette.common.white }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Box>

            {transcriptionData ? (
              <>
                <Box
                  sx={{
                    position: "relative",
                    paddingX: 1,
                    paddingY: 2,
                    overflowY: "auto",
                  }}
                >
                  {activeTab === 0 && (
                    <MarkdownText
                      title="Transcription"
                      transcription={transcriptionData.transcription}
                      language={selectedLanguage}
                      audioFileName={audioFileName}
                    />
                  )}
                  {activeTab === 1 && (
                    <MarkdownText
                      title="Notes"
                      transcription={transcriptionData.notes}
                      language={selectedLanguage}
                      audioFileName={audioFileName}
                    />
                  )}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    marginTop: 2,
                  }}
                >
                  <ExportPdfButton
                    contentToExport={
                      activeTab === 0
                        ? transcriptionData.transcription
                        : transcriptionData.notes
                    }
                  />
                </Box>
              </>
            ) : (
              <Typography
                sx={{
                  padding: 2,
                  fontWeight: "bold",
                  fontStyle: "italic",
                }}
              >
                {isLoadingResponse
                  ? "Loading..."
                  : "No transcription or notes available."}
              </Typography>
            )}
          </Box>
        </Box>
      </Main>
    </Box>
  );
}
