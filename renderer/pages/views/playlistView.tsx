import {FunctionComponent, useContext, useEffect, useState} from "react";
import {Playlist, PlaylistEntry, Song} from "../../backend/LibraryManager";
import {AppControlContext} from "../../components/appContextProvider";
import {Play, PlayCircle} from "react-feather";
import {secondsToMMSSFormat} from "../../helpers/HelperFunctions";
import AnimatedEQ from "../../components/icons/AnimatedEQ";

interface PlaylistView_Props {
    playlistUID: string
}

const PlaylistView: FunctionComponent<PlaylistView_Props> = ({playlistUID}) => {

    const [playlist, setPlaylist] = useState<Playlist>(null);

    const {libraryManager} = useContext(AppControlContext);

    useEffect(() => {
        const playlistFromManager = libraryManager.playlists.find((e) => e.uid == playlistUID)
        setPlaylist(playlistFromManager);
    }, [playlistUID]);

    return (
        <div className={"h-full w-full"}>
            {playlist !== null ? (
                <div className={"h-full"}>
                    {playlist.entries.length > 0 ? (
                        <ul className={"overflow-y-scroll h-full hideScrollbar"}>
                            {playlist.entries.map((entry, index) => {
                                const song = libraryManager.musicCatalogue.find((e) => e.uid == entry.song);
                                return (
                                    <PlaylistEntryCell playlistUID={playlistUID} entry={entry} song={song} index={index} key={entry.uid} />
                                )
                            })}
                        </ul>
                    ) : (
                        <div className={"w-full h-full flex justify-center items-center"}>
                            <h1 className={"text-3xl font-bold"}>Keine Lieder in dieser Playlist</h1>
                        </div>
                    )}
                </div>
            ) : (
                <p>Lädt...</p>
            )}
        </div>
    )
}

interface PlaylistEntryCell_Props {
    playlistUID: string
    entry: PlaylistEntry
    song: Song
    index: number
}

const PlaylistEntryCell: FunctionComponent<PlaylistEntryCell_Props> = ({playlistUID, entry, song, index}) => {

    const {playSong, currentlyPlaying} = useContext(AppControlContext);
    return (
        <li className={"flex m-2 p-2 rounded-lg items-center border-b dark:border-gray-500"}>
            <div className={"w-8"}>
                {currentlyPlaying !== null && currentlyPlaying.song.uid === song.uid && currentlyPlaying.playlist === playlistUID && currentlyPlaying.playlistEntry === entry.uid ? (
                    <AnimatedEQ isAnimating={!currentlyPlaying.audio.paused} />
                ) : (
                    <p className={"text-gray-500 mr-2 text-center text-lg"}>{index + 1}</p>
                )}
            </div>
            <button className={"bg-blue-500 rounded-lg w-9 h-9 flex justify-center items-center"} onClick={() => {
                playSong(song, playlistUID, entry.uid);
            }}>
                <Play color={"white"} className={"w-7 h-7"} />
            </button>
            <div className={"flex-col ml-2"}>
                <div className={"flex items-center"}>
                    <h1 className={"text-lg font-bold"}>{entry.customName}</h1>
                    <p className={"italic text-sm ml-2 text-gray-400"}>("{song.name}")</p>
                </div>
                <p className={"text-sm text-gray-400"}>{secondsToMMSSFormat(song.duration)} • {typeof song.metadata.artist === "string" ? song.metadata.artist : "Unknown Artist"}</p>
            </div>
        </li>
    )
}

export default PlaylistView;