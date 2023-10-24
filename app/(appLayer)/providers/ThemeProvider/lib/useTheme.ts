'use client'
import {useContext} from "react";
import { LOCAL_STORAGE_THEME_KEY, Theme, ThemeContext } from "./ThemeContext";

interface UseThemeResult {
    toggleTheme?: () => void
    theme?: Theme;
}

export function useTheme(): UseThemeResult {
    const {theme, setTheme} = useContext(ThemeContext);

    const toggleTheme = () => {
        const newTheme = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK
        setTheme(newTheme)
        localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme)
        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        metaThemeColor?.setAttribute("content", `${theme === Theme.DARK ? '#1f1f1f' : '#ffffff'}`); 

    }

    return {
        theme,
        toggleTheme,
    }
}