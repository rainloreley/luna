import {FunctionComponent, ReactElement} from "react";

const Sidebar_ViewWrapper = ({title, children}) => {
    return (
        <div className={"w-full relative h-full"}>
            <div className={"p-3 py-3 h-16 border-b dark:border-gray-500"}>
                <h1 className={"text-3xl font-bold"}>{title}</h1>
            </div>
            <div className={"sidebarWrapperChildrenHeight"}>
                {children}
            </div>
        </div>
    )

}

export default Sidebar_ViewWrapper