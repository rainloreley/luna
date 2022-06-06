import {FunctionComponent, ReactElement} from "react";

const Sidebar_ViewWrapper = ({title, note, children}) => {
    return (
        <div className={"w-full relative h-full"}>
            <div className={"p-3 py-3 h-16 flex justify-between items-center border-b dark:border-gray-500"}>
                <h1 className={"text-3xl font-bold text-ellipsis truncate w-3/4"}>{title}</h1>
                <p className={"ml-2 italic text-gray-600 dark:text-gray-400 text-sm"}>{note}</p>
            </div>
            <div className={"sidebarWrapperChildrenHeight"}>
                {children}
            </div>
        </div>
    )

}

export default Sidebar_ViewWrapper