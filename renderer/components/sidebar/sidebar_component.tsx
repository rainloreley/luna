import React, {FunctionComponent, ReactElement, useState} from 'react';
import {Music} from "react-feather"

const SidebarComponent: FunctionComponent = () => {

    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    return (
        <div className={"w-60 bg-gray-100 dark:bg-dark-secondary h-full"}>
            <ul className={"p-4 w-full"}>
                <button className={"w-full"}>
                    <SidebarElement title={"Bibliothek"} icon={<Music />} selected={selectedIndex == 0} />
                </button>
            </ul>
        </div>
    )
}

interface SidebarElement_Props {
    title: string
    icon: ReactElement
    selected: boolean
}
const SidebarElement: FunctionComponent<SidebarElement_Props> = ({title, icon, selected}) => {
    return (
        <li className={`w-full p-1 rounded-lg flex ${selected ? "bg-blue-500" : ""}`}>
            {icon}
            <p className={`text-left ${selected ? "text-white" : "text-black"}`}>{title}</p>
        </li>
    )
}

export default SidebarComponent;