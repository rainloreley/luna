import {ipcRenderer} from "electron";
import LibraryManager, {PlaylistEntry, PlaylistEntryEndBehavior, Song} from "../backend/LibraryManager";
import {createContext, Dispatch, SetStateAction, useEffect, useState} from "react";
import {
    Download,
    Moon,
    Pause,
    Play,
    SkipBack,
    SkipForward,
    Speaker,
    Sun,
    Volume,
    Volume1,
    Volume2
} from "react-feather";
import {CircularProgress, Slider} from "@mui/material";
import {secondsToMMSSFormat} from "../helpers/HelperFunctions";
import {v4 as uuidv4} from "uuid";

type AppControlHandlerProps = {
    libraryManager: LibraryManager;
    setLibraryManager: Dispatch<SetStateAction<LibraryManager>>;
    playSong: (song: Song, playlist: string, playlistEntry: string) => void;
    currentlyPlaying: PlayingSong;
    addSongsToPlaylist: (playlistUID: string, songs: string[]) => void;
}

interface NotificationCenterElement {
    uid: string;
    text: string;
    status: NotificationCenterElementStatus;
    dismissAt?: number;
}

enum NotificationCenterElementStatus {
    loading, notification, error, success
}

export const AppControlContext = createContext<AppControlHandlerProps>(null);

const AppControlProvider = ({children}) => {

    const [libraryManager, setLibraryManager] = useState<LibraryManager | null>(null);

    const [currentlyPlaying, setCurrentlyPlaying] = useState<PlayingSong | null>(null);
    const [currentlyPlayingProgressInMS, setCurrentlyPlayingProgressInMS] = useState<number>(0);
    const [currentlyPlayingPaused, setCurrentlyPlayingPaused] = useState(true);

    const [playerVolume, setPlayerVolume] = useState<number>(1);

    const [importLoadingIndicatorVisible, setImportLoadingIndicatorVisible] = useState<boolean>(false);
    const [importStatusText, setImportStatusText] = useState<string>("");

    const [notificationCenter, setNotificationCenter] = useState<NotificationCenterElement[]>([]);
    var notificationcenterInterval: NodeJS.Timeout;

    const [appTheme, setAppTheme] = useState("light");

    var updatingTime = false;

    useEffect(() => {
        if (libraryManager == null) {
            const _loadedLibraryManager = LibraryManager.loadData();
            setLibraryManager(_loadedLibraryManager);
        }
        clearInterval(notificationcenterInterval);
        notificationcenterInterval = setInterval(() => {
            setNotificationCenter((e) => [
                ...e.filter(
                    (f) => f.dismissAt === undefined || f.dismissAt > Date.now()
                ),
            ]);
        }, 1000);

        ipcRenderer.removeAllListeners("app::color-scheme")
        ipcRenderer.on("app::color-scheme", (event, args) => {
            console.log(args);
            setAppTheme(args);
        })

        ipcRenderer.send("app::get-color-scheme");

    }, []);

    useEffect(() => {
        ipcRenderer.removeAllListeners("app::import-music-paths-ready");
        ipcRenderer.on("app::import-music-paths-ready", (event, args) => {
            setImportLoadingIndicatorVisible(true);
            libraryManager.importMusic(args, processImportUpdate).then((res) => {
                setImportLoadingIndicatorVisible(false);
                const importCompleteNotification: NotificationCenterElement = {
                    uid: uuidv4(),
                    text: "Import complete!",
                    status: NotificationCenterElementStatus.success,
                    dismissAt: Date.now() + 2000
                }
                addElementToNotificationCenter(importCompleteNotification);
                setLibraryManager(res);
                ipcRenderer.send("app::reload-catalogue-to-main", JSON.stringify(res.musicCatalogue));
            })
        })
    }, [libraryManager]);

    const processImportUpdate = (name, index, total) => {
        setImportStatusText(`Processing "${name}" (${index}/${total})`);
    }

    function addElementToNotificationCenter(element: NotificationCenterElement) {
        setNotificationCenter((e) => [...e, element]);
    }

    function updateElementInNotificationCenter(
        element: NotificationCenterElement
    ) {
        setNotificationCenter((e) => {
            const index = e.findIndex((f) => f.uid === element.uid);
            if (index > -1) e[index] = element;
            return e;
        });
    }

    useEffect(() => {
        if (currentlyPlaying != null && !updatingTime) {
            currentlyPlaying.audio.ontimeupdate = (_) => {
                updatingTime = true
                setCurrentlyPlayingProgressInMS(parseInt((currentlyPlaying.audio.currentTime * 1000).toFixed(0)))
            }
            currentlyPlaying.audio.onplaying = (_) => {
                setCurrentlyPlayingPaused(false);
            }
            currentlyPlaying.audio.onpause = (_) => {
                setCurrentlyPlayingPaused(true);
            }

            currentlyPlaying.audio.onended = async (_) => {
                await endSongHandler();
            }
        }
        else {
            updatingTime = false;
        }
    }, [currentlyPlaying]);

    const endSongHandler = async () => {
        if (currentlyPlaying.playlist !== "library") {
            const playlist = libraryManager.playlists.find((e) => e.uid == currentlyPlaying.playlist);
            if (playlist === undefined) return;
            const playlistEntry = playlist.entries.find((e) => e.uid == currentlyPlaying.playlistEntry);
            if (playlistEntry === undefined) return;
            if (playlistEntry.endBehavior === PlaylistEntryEndBehavior.stop) {
                setCurrentlyPlaying(null);
                return;
            }
            const nextSongIndex = playlistEntry.index + 1;
            const nextEntry = playlist.entries.find((e) => e.index === nextSongIndex);
            if (nextEntry === undefined) return;
            const nextSong = libraryManager.musicCatalogue.find((e) => e.uid == nextEntry.song);
            if (nextSong === undefined) return;
            await playSong(nextSong, playlist.uid, nextEntry.uid);
        }
        else {
            // Library shouldn't (currently) support autoplay
            return
        }
    }

    const playSong = async (song: Song, playlist: string, playlistEntry: string) => {
        if (currentlyPlaying != null) {
            currentlyPlaying.audio.pause();
        }
        const _audioElement = new Audio(`file://${song.path}`);
        _audioElement.volume = playerVolume;
        const _playingSong = new PlayingSong(song, playlist, playlistEntry, _audioElement);
        _playingSong.audio.play().then((_) => {
            setCurrentlyPlayingPaused(false);
            setCurrentlyPlaying(_playingSong);
        });
    }

    const changeVolume = (volume: number) => {
        if (volume < 0 || volume > 1) return;
        setPlayerVolume(volume);
        if (currentlyPlaying !== null) {
            currentlyPlaying.audio.volume = volume;
        }
    }

    const addSongsToPlaylist = (playlistUID: string, songs: string[]) => {
        const playlist = libraryManager.playlists.find((e) => e.uid === playlistUID);
        if (playlist === undefined) {
            const errorMessage: NotificationCenterElement = {
                uid: uuidv4(),
                text: "Die Playlist wurde nicht gefunden",
                status: NotificationCenterElementStatus.error,
                dismissAt: Date.now() + 2000
            }
            addElementToNotificationCenter(errorMessage);
            return;
        }

        var _newEntries: PlaylistEntry[] = [];
        for (const _songID of songs) {
            const _song = libraryManager.musicCatalogue.find((e) => e.uid === _songID);
            const _entry: PlaylistEntry = {
                uid: uuidv4(),
                customName: _song.name,
                song: _songID,
                index: playlist.entries.length + _newEntries.length,
                endBehavior: PlaylistEntryEndBehavior.next
            }
            _newEntries.push(_entry);
        }
        const _allEntries = playlist.entries.concat(_newEntries);
        setLibraryManager((e) => {
            e.playlists.find((p) => p.uid === playlistUID).entries = _allEntries;
            return e;
        });

        const completionMessage: NotificationCenterElement = {
            uid: uuidv4(),
            status: NotificationCenterElementStatus.success,
            text: `${_newEntries.length} Lieder hinzugefügt`,
            dismissAt: Date.now() + 2000
        }
        addElementToNotificationCenter(completionMessage);
        libraryManager.saveData();

    }

    const state: AppControlHandlerProps = {
        libraryManager: libraryManager,
        setLibraryManager: setLibraryManager,
        playSong: playSong,
        currentlyPlaying: currentlyPlaying,
        addSongsToPlaylist: addSongsToPlaylist
    }
    // @ts-ignore
    return (
     <div className={"dark"}>
         <div className={`h-full m-0 dark:bg-dark-primary dark:text-white overflow-hidden`}>
             {libraryManager != null ? (
                 <AppControlContext.Provider value={state}>
                     <div className={"flex flex-col h-screen m-0"}>

                         <div className="absolute bottom-6 right-6 flex z-20 text-white flex-col">
                             {notificationCenter.map((notification) => (
                                 <div
                                     key={notification.uid}
                                     className={`m-4 flex flex-row p-3 rounded-lg w-64 justify-between pl-4 ${
                                         notification.status === NotificationCenterElementStatus.error
                                             ? 'bg-red-500'
                                             : `${
                                                 notification.status ===
                                                 NotificationCenterElementStatus.success
                                                     ? 'bg-green-400'
                                                     : 'bg-gray-400 dark:bg-gray-600'
                                             }`
                                     }`}
                                 >
                                     <p>{notification.text}</p>
                                     {notification.status ===
                                     NotificationCenterElementStatus.loading ? (
                                         <div className="w-5 ml-4 mr-2">
                                             <CircularProgress sx={{
                                                 color: "#fff"
                                             }} size={25} />
                                         </div>
                                     ) : (
                                         <div/>
                                     )}
                                 </div>
                             ))}
                         </div>

                         <div className={"bg-gray-100 dark:bg-dark-secondary p-3 h-14 flex items-center justify-between border-b border-gray-400 dark:border-gray-600"}>
                             <div className={"flex items-center"}>
                                 <Speaker className={"mr-2"} width={20} />
                                 <h1 className={"text-xl font-bold bg-gradient-to-tr from-red-400 to-purple-400 text-transparent bg-clip-text"}>Luna</h1>
                             </div>
                             <div className={"flex items-center"}>
                                 {importLoadingIndicatorVisible ? (
                                     <div className={"mr-3 flex items-center"}>
                                         <p className={"mr-3 italic text-sm text-gray-500"}>{importStatusText}</p>
                                         <CircularProgress size={25} />
                                     </div>

                                 ) : (
                                     <div />
                                 )}
                                 <button disabled={importLoadingIndicatorVisible} onClick={async () => {
                                     await ipcRenderer.send("app::import-music");
                                 }}>
                                     <Download />
                                 </button>
                                 <button className={"ml-2"} onClick={async () => {
                                     const newScheme = appTheme == "dark" ? "light" : "dark";
                                     await ipcRenderer.send("app::set-color-scheme", newScheme)
                                     setAppTheme(newScheme)
                                 }}>
                                     {appTheme == "dark" ? (
                                         <Sun />
                                     ) : (
                                         <Moon />
                                     )}
                                 </button>
                             </div>
                         </div>
                         {children}
                         <div className={"flex p-4 h-28 justify-between items-center bg-gray-100 dark:bg-dark-secondary border-t border-gray-400 dark:border-gray-600 fixed bottom-0 left-0 right-0"}>
                             <div className={"w-28 ml-2"} />
                             <div className={"w-1/2 flex flex-col items-center"}>
                                 <div>
                                     <div className={"flex justify-center"}>
                                         <button>
                                             <SkipBack />
                                         </button>
                                         <button className={"mx-1"} onClick={async () => {
                                             if (currentlyPlaying != null) {
                                                 if (currentlyPlayingPaused) {
                                                     await currentlyPlaying.audio.play()
                                                 }
                                                 else {
                                                     await currentlyPlaying.audio.pause()
                                                 }
                                             }
                                         }}>
                                             {!currentlyPlayingPaused ? (
                                                 <Pause />
                                             ) : (
                                                 <Play />
                                             )}

                                         </button>
                                         <button>
                                             <SkipForward />
                                         </button>
                                     </div>
                                     {currentlyPlaying != null ? (
                                         <h1 className={"text-lg font-bold text-center"}>{currentlyPlaying.playlist !== "library" ?
                                             libraryManager.playlists.find((e) => e.uid == currentlyPlaying.playlist).entries.find((e) => e.uid == currentlyPlaying.playlistEntry).customName
                                             : currentlyPlaying.song.name}</h1>
                                     ) : (
                                         <h1 className={"italic text-gray-600 dark:text-gray-500"}>Kein Lied ausgewählt</h1>
                                     )}
                                 </div>
                                 <div className={"flex w-full items-center"}>
                                     <p className={"text-gray-500 text-sm mr-3"}>{secondsToMMSSFormat(currentlyPlayingProgressInMS / 1000)}</p>
                                     <Slider size="small" min={0} step={1} max={currentlyPlaying != null ? currentlyPlaying.audio.duration * 1000 : 1} disabled={currentlyPlaying == null} value={currentlyPlayingProgressInMS} onChange={(e) => {
                                         setCurrentlyPlaying((song) => {
                                             // @ts-ignore
                                             song.audio.currentTime = e.target.value / 1000
                                             return song;
                                         })
                                     }} sx={{
                                         color: "#3B82F6",
                                     }} />
                                     {currentlyPlaying != null ? (
                                         <p className={"text-gray-500 text-sm ml-3"}>{secondsToMMSSFormat(Math.floor(currentlyPlaying.audio.duration))}</p>
                                     ) : (
                                         <p></p>
                                     )}
                                 </div>
                             </div>
                             <div className={"w-28 mr-2 flex items-center"}>
                                 {(() => {
                                     if (playerVolume == 0) {
                                         return <Volume />
                                     }
                                     else if (playerVolume < 0.5) {
                                         return <Volume1 />
                                     }
                                     else {
                                         return <Volume2 />
                                     }
                                 })()}
                                 <Slider size={"small"} className={"ml-2"} min={0} max={1} step={0.02} value={playerVolume} onChange={(e) => {
                                     // @ts-ignore
                                     changeVolume(Number(e.target.value))
                                 }} sx={{
                                     color: "#3B82F6",
                                 }} />
                             </div>
                         </div>
                     </div>
                 </AppControlContext.Provider>
             ) : (
                 <div className={"bg-dark-primary flex h-full w-full justify-center items-center"}>
                     <div className={"flex flex-col items-center"}>
                         <img src={"/svg/loading.svg"} className={"mb-2"} />
                         <h1 className={"text-white"}>Loading...</h1>
                     </div>
                 </div>
             )}
         </div>
     </div>
    )
}

class PlayingSong {
    song: Song
    playlist: string
    playlistEntry: string
    audio: HTMLAudioElement
    progress: number

    constructor(song: Song, playlist: string, playlistEntry: string, audio: HTMLAudioElement) {
        this.song = song;
        this.playlist = playlist;
        this.playlistEntry = playlistEntry;
        this.audio = audio;
    }
}
export {PlayingSong};
export default AppControlProvider