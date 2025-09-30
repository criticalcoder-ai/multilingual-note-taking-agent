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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, Tab, Box, CircularProgress } from "@mui/material";

import { copyToClipboard } from "../utils";
import LanguageDropdown from "./Dropdown";
import NotesModelDropdown from "./Dropdown";
import TransModelDropdown from "./Dropdown";
import AudioDropzone from "./AudioDropzone";
import Autoselect from "./Autoselect";
import MarkdownText from "./MarkdownText";
import { api } from "../api/api";

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
  { label: "Cantonese Chinese", value: "cantonese" },
  { label: "French", value: "french" },
  { label: "Spanish", value: "spanish" },
  { label: "Portuguese", value: "portuguese" },
  { label: "Japanese", value: "japanese" },
  { label: "German", value: "german" },
];

const transModelOptions = [
  { label: "Faster-Whisper(Default)", value: "faster_whisper" },
  { label: "Alibaba ASR", value: "alibaba_asr_api" },
  { label: "Whisper", value: "whisper" },
  { label: "dummy", value: "dummy" },
];

const notesModelOptions = [
  { label: "Qwen (Default)", value: "qwen_openrouter_api" },
  { label: "Deepseek", value: "deepseek_openrouter_api" },
  { label: "Gemini", value: "gemini_openrouter_api" },
  { label: "dummy", value: "dummy" },
];

const fetchSearchResults = async (query: string) => {
  console.log("hello from search");
  if (!query) return [];
  const res = await api.get(`/api/outputs/search/?search_text=${query}`);
  const data = res.data;
  console.log("hello got search data", data);
  return data;
};

export default function PersistentDrawerLeft() {
  const theme = useTheme();
  const navigate = useNavigate();

  const { sessionId } = useParams({ strict: false }) || { sessionId: "1" };
  console.log("sessionId", sessionId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [sessionName, setSessionName] = useState(sessionId || "New Session");

  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [selectedNotesModel, setSelectedNotesModel] = useState<string>(
    "qwen_openrouter_api",
  );
  const [selectedTransModel, setSelectedTransModel] =
    useState<string>("faster_whisper");
  const [prompt, setPrompt] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>("");
  const [sendState, setSendState] = useState(true);
  const [transcriptionData, setTranscriptionData] =
    useState<TranscriptionResponse | null>(null);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const isNewChat = sessionId === "new";

  const queryClient = useQueryClient();

  // API Endpoints:
  const {
    data: sessions = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["audio-sessions"],
    queryFn: async () => {
      const res = await api.get(`/api/audio-sessions/`);

      if (!Array.isArray(res.data)) {
        throw new Error("Invalid response format: expected array");
      }

      return res.data;
    },
  });

  const {
    data: searchSessions,
    isLoading: searchIsLoading,
    isError: searchIsErr,
  } = useQuery({
    queryKey: ["search", "audio-sessions", searchTerm],
    queryFn: () => fetchSearchResults(searchTerm),
    enabled: searchTerm.length > 0,
  });

  const {
    data: currSession = null,
    isLoading: currSessionLoading,
    isError: currSessionIsErr,
    error: currSessionErr,
  } = useQuery({
    queryKey: ["audio-sessions", "curr-session", sessionId],
    queryFn: async () => {
      console.log("hello from currsess query ");
      const res = await api.get(`/api/audio-sessions/${sessionId}/`);
      console.log("hello from currsess query - res:", res);

      return res.data;
    },
    enabled: sessionId !== undefined && sessionId !== "new",
  });
  console.log("currSession", currSession);

  useEffect(() => {
    if (isNewChat) {
      setSessionName("New Session");
      setSelectedLanguage("english");
      setPrompt("");
      setAudioFile(null);
      setSelectedNotesModel("qwen_openrouter_api");
      setSelectedTransModel("faster_whisper");
      setAudioFileName("");
      setSelectedTags([]);
      setTranscriptionData(null);
      setSendState(true);
      return;
    }

    console.log("sessions.length", sessions.length);

    if (currSession) {
      console.log("currSession", currSession);
      setSessionName(currSession.session_name);
      setSelectedLanguage(currSession.query_lang.toLowerCase());
      setPrompt(currSession.query_prompt);
      setAudioFileName(currSession.query_file);

      // If this session already has data, show the transcription/notes tabs
      if (
        currSession?.output?.transcription_text ||
        currSession?.output?.notes_text
      ) {
        setTranscriptionData({
          transcription: currSession?.output?.transcription_text || "",
          notes: currSession?.output?.notes_text || "",
        });
      }
    }
  }, [sessions, sessionId, isNewChat, currSession]);

  console.log("searchTerm.length", searchTerm.length);
  console.log("searchSessions", searchSessions);
  console.log("sessions", sessions);

  const filteredChats =
    searchTerm.length > 0
      ? searchIsLoading || searchIsErr
        ? []
        : searchSessions
      : sessions;

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

    setIsLoadingResponse(true);
    let currentSessionId = sessionId;

    if (isNewChat) {
      try {
        const createRes = await api.get(`/api/audio-sessions/new/`);
        currentSessionId = createRes.data;
        console.log("New session created with ID:", currentSessionId);
      } catch (error) {
        console.error("Error creating new session: ", error);
        window.alert("Error creating new session!");
        return;
      }
    }

    const formData = new FormData();
    formData.append("file", audioFile);

    const params = new URLSearchParams({
      session_id: String(currentSessionId),
      session_name: sessionName,
      transcription_method: selectedTransModel,
      notes_method: selectedNotesModel,
      query_prompt: prompt,
      query_lang: selectedLanguage,
      query_audio_kind: tagsString,
    });

    // window.alert(`
    //   Session ID: ${currentSessionId}
    //   Session Name: ${sessionName}
    //   File: ${audioFileName}
    //   Prompt: ${prompt}
    //   Language: ${selectedLanguage}
    //   Tags: ${tagsString}
    //   Audio Model: ${selectedTransModel}
    //   Notes Model: ${selectedNotesModel}`);

    console.log("Sending payload:", formData);

    try {
      const res = await api.post(
        `/api/transcribe-and-generate-notes/?${params.toString()}`,
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
        queryClient.invalidateQueries({ queryKey: ["audio-sessions"] });
      } else {
        console.error("Unexpected response:", res);
        window.alert("Unexpected error occurred!");
      }
    } catch (error) {
      console.error("Error sending request:", error);
      window.alert("Error sending request: ");
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  if (isError) {
    return <Typography>Error fetching sessions. {error?.message}</Typography>;
  }

  if (currSessionIsErr) {
    return (
      <Typography>Error fetching session {currSessionErr.message}</Typography>
    );
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
          <Box sx={{ minWidth: 150, ml: "auto", paddingRight: "1rem" }}>
            <TransModelDropdown
              title="Transcription Model"
              options={transModelOptions}
              value={selectedTransModel}
              onChange={(val) => setSelectedTransModel(val)}
            />
          </Box>
          <Box sx={{ minWidth: 150, ml: "auto" }}>
            <NotesModelDropdown
              title="Notes Model"
              options={notesModelOptions}
              value={selectedNotesModel}
              onChange={(val) => setSelectedNotesModel(val)}
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
              navigate({ to: `/chat/new` });
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
          {isLoading ? (
            <CircularProgress
              color="primary"
              sx={{ position: "relative", left: "5rem", top: "1rem" }}
            />
          ) : filteredChats.length > 0 ? (
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
      {currSessionLoading ? (
        <CircularProgress
          color="primary"
          sx={{ position: "relative", left: "3rem", top: "5rem" }}
        />
      ) : (
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
                  input: {
                    color: "black",
                    fontWeight: 600,
                    fontSize: "1.25rem",
                  },
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
                  // e.g. api.post(`${API_URL}/api/audio-sessions/${sessionId}/rename`, { session_name: sessionName })
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
      )}
    </Box>
  );
  console.log("filteredChats.length", filteredChats.length);
}
