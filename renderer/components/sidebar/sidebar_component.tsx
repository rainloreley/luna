import React, {FunctionComponent, ReactElement, useContext, useEffect, useState} from 'react';
import {Check, Music, X} from "react-feather"
import {AppControlContext} from "../appContextProvider";
import {Playlist} from "../../backend/LibraryManager";
import {v4 as uuidv4} from "uuid";
import {LunaboardClickableRotaryEncoder} from "../../backend/LunaboardController";

interface SidebarComponent_Props {
    selectItem: (uid: string) => void
    rightClickItem: (uid: string) => void;
}

const SidebarComponent: FunctionComponent<SidebarComponent_Props> = ({selectItem, rightClickItem}) => {

    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [isCreatingNewPlaylist, setIsCreatingNewPlaylist] = useState<boolean>(false);
    const {libraryManager, setLibraryManager, lunaboardController, setLunaboardController} = useContext(AppControlContext);

    const itemSelected = (index: number, uid?: string) => {

        // Remove any listeners to the scroll wheel
        /*const _LBListScrollElement = lunaboardController.elements.findIndex((e) => e.identifier == "re1");
        console.log(_LBListScrollElement);
        if (_LBListScrollElement === -1) return;
        setLunaboardController((e) => {
            (e.elements[_LBListScrollElement] as LunaboardClickableRotaryEncoder).rotateCallback = () => {};
            (e.elements[_LBListScrollElement] as LunaboardClickableRotaryEncoder).buttonCallback = () => {};
            return e;
        })*/

        setSelectedIndex(index);
        if (index == 0) {
            selectItem("library");
        }
        else {
            selectItem(uid);
        }
    }

    return (
        <div className={`${isCreatingNewPlaylist ? "w-80" : "w-64"} bg-gray-100 dark:bg-dark-secondary h-full`}>
            <ul className={"p-3 w-full"}>
                <div className={"w-full border-b-2 dark:border-gray-600 py-2 mb-2"}>
                    <button className={"w-full"} onClick={() => {
                        itemSelected(0);
                        setIsCreatingNewPlaylist(false);
                    }}>
                        <SidebarElement title={"Bibliothek"} icon={<Music />} selected={selectedIndex == 0} />
                    </button>
                </div>
                {libraryManager.playlists.map((playlist, index) => (
                    <div className={"w-full my-1"}>
                        <button className={"w-full"} onClick={() => {
                            setIsCreatingNewPlaylist(false);
                            itemSelected(index + 1, playlist.uid);
                        }}  onContextMenu={() => {
                            rightClickItem(playlist.uid)
                        }}>
                            <SidebarElement title={playlist.name} color={playlist.color} selected={selectedIndex == index + 1} />
                        </button>
                    </div>
                ))}
                <div className={"mt-2"}>
                    {isCreatingNewPlaylist ? (
                        <SidebarElementCreation cancelHandler={() => {
                            setIsCreatingNewPlaylist(false);
                        }} confirmHandler={(name, color) => {
                            const _newPlaylist: Playlist = {
                                uid: uuidv4(),
                                name: name,
                                color: color,
                                entries: []
                            }
                            setLibraryManager((e) => {
                                e.playlists.push(_newPlaylist);
                                e.saveData()
                                return e;
                            });
                            setIsCreatingNewPlaylist(false);
                        }}/>
                    ) : (
                        <div className={"flex w-full justify-center"}>
                            <button className={"w-8 h-8 flex items-center justify-center p-2 bg-gray-300 dark:bg-gray-600 opacity-40 rounded-full hover:opacity-60"} onClick={() => {
                                setIsCreatingNewPlaylist(true);
                            }}>
                                <p>+</p>
                            </button>
                        </div>
                    )}
                </div>
            </ul>
        </div>
    )
}

interface SidebarElement_Props {
    title: string
    icon?: ReactElement
    color?: string
    selected: boolean
}
const SidebarElement: FunctionComponent<SidebarElement_Props> = ({title, icon, color, selected}) => {
    return (
        <li className={`w-full px-2 py-1 rounded-lg items-center flex ${selected ? "bg-blue-500" : "hover:bg-gray-200 hover:dark:bg-dark-tertiary"}`}>
            {icon !== undefined ? (
                <div className={`${selected ? "text-white" : ""}`}>
                    {icon}
                </div>
            ) : (
                <p></p>
            )}
            {color !== undefined ? (
                <div className={"w-4 h-4 mr-1 rounded-full"} style={{
                    background: color
                }} />
            ) : (
                <p></p>
            )}
            <p className={`text-left ml-1 text-ellipsis truncate w-11/12 ${selected ? "text-white" : ""}`}>{title}</p>
        </li>
    )
}

interface SidebarElementCreation_Props {
    cancelHandler: () => void;
    confirmHandler: (name: string, color: string) => void;
}

const SidebarElementCreation: FunctionComponent<SidebarElementCreation_Props> = ({cancelHandler, confirmHandler}) => {

    const [playlistName, setPlaylistName] = useState<string>("");

    const colors = [
        "F2D1D1",
        "8CC0DE",
        "F4BFBF",
        "FFD9C0",
        "FAF0D7",
        "9AD0EC",
        "1572A1",
        "E3BEC6",
        "B983FF",
        "94B3FD",
        "E2C2B9",
        "BFD8B8",
        "CEE5D0",
        "B5CDA3",
        "F29191",
        "776D8A"
    ]

    const [playlistColor, setPlaylistColor] = useState("");

    useEffect(() => {
        if (playlistColor === "") {
            generateColor()
        }
    }, []);

    const generateColor = () => {
        setPlaylistColor(colors[Math.floor(Math.random() * colors.length)]);
    }

    const createPlaylist = () => {
        if (playlistName.length > 0) {
            confirmHandler(playlistName, `#${playlistColor}`);
        }
    }

    return (
        <li className={"w-full px-2 py-2 rounded-lg flex items-center bg-gray-200 dark:bg-dark-tertiary"}>
            <button className={"w-4 h-4 mr-1 rounded-full"} style={{
                background: `#${playlistColor}`
            }} onClick={generateColor} />
            <input placeholder={"Neue Playlist"} autoFocus={true} value={playlistName} onChange={(e) => {
                setPlaylistName(e.target.value);
            }} className={"w-2/3 px-2 mx-2 rounded-lg dark:bg-gray-800"} />
            <button onClick={createPlaylist}>
                <Check className={"text-green-500"} />
            </button>
            <button onClick={cancelHandler}>
                <X className={"text-red-500"} />
            </button>
        </li>
    )
}

export default SidebarComponent;