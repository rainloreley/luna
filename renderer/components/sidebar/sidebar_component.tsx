import React, {FunctionComponent, ReactElement, useContext, useState} from 'react';
import {Music} from "react-feather"
import {AppControlContext} from "../appContextProvider";

interface SidebarComponent_Props {
    selectItem: (uid: string) => void
}

const SidebarComponent: FunctionComponent<SidebarComponent_Props> = ({selectItem}) => {

    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const itemSelected = (index: number, uid?: string) => {
        setSelectedIndex(index);
        if (index == 0) {
            selectItem("library");
        }
        else {
            selectItem(uid);
        }
    }

    const {libraryManager} = useContext(AppControlContext);
    return (
        <div className={"w-60 bg-gray-100 dark:bg-dark-secondary h-full"}>
            <ul className={"p-3 w-full"}>
                <div className={"w-full border-b-2 dark:border-gray-600 py-2 mb-2"}>
                    <button className={"w-full"} onClick={() => {
                        itemSelected(0);
                    }}>
                        <SidebarElement title={"Bibliothek"} icon={<Music />} selected={selectedIndex == 0} />
                    </button>
                </div>
                {libraryManager.playlists.map((playlist, index) => (
                    <div className={"w-full"}>
                        <button className={"w-full"} onClick={() => {
                            itemSelected(index + 1, playlist.uid);
                        }}>
                            <SidebarElement title={playlist.name} color={playlist.color} selected={selectedIndex == index + 1} />
                        </button>
                    </div>
                ))}
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
        <li className={`w-full px-2 py-1 rounded-lg items-center flex ${selected ? "bg-blue-500" : ""}`}>
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
            <p className={`text-left ml-1 ${selected ? "text-white" : ""}`}>{title}</p>
        </li>
    )
}

export default SidebarComponent;