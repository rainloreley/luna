import styles from "../../styles/AnimatedEQ.module.css"
import {FunctionComponent} from "react";

/*
Credit: https://codepen.io/ViRPo/pen/YzKWWPW
Slightly modified
*/

interface AnimatedEQ_Props {
    isAnimating: boolean
}

const AnimatedEQ: FunctionComponent<AnimatedEQ_Props> = ({isAnimating}) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <rect className={`${styles.eqbar} ${isAnimating ? `${styles.eqbar1}` : ""}`} x="4" y="4" width="3.7" height="8"/>
            <rect className={`${styles.eqbar} ${isAnimating ? `${styles.eqbar2}` : ""}`} x="10.2" y="4" width="3.7" height="16"/>
            <rect className={`${styles.eqbar} ${isAnimating ? `${styles.eqbar3}` : ""}`} x="16.3" y="4" width="3.7" height="11"/>
        </svg>

    )
}
export default AnimatedEQ