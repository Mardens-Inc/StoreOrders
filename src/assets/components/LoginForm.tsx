import {Button, Input} from "@nextui-org/react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faLock, faUser} from "@fortawesome/free-solid-svg-icons";
import React, {useState} from "react";
import ExtendedSwitch from "./Extends/ExtendedSwitch.tsx";
import {useAuthProvider} from "../providers/AuthProviderProvider.tsx";
import {LoginResponse} from "../ts/authentication.ts";

export default function LoginForm()
{
    const [rememberMe, setRememberMe] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [error, setError] = useState("");
    const {auth, setIsLoggedIn} = useAuthProvider();

    const login = () =>
    {
        setError("");
        setUsernameError("");
        setPasswordError("");

        auth.login(username, password, rememberMe ? 30 : -1).then((response: LoginResponse) =>
        {
            if (!response.success)
            {
                if (response.message.includes("username")) setUsernameError(response.message);
                if (response.message.includes("password")) setPasswordError(response.message);
                setError(response.message);
                setIsLoggedIn(false);
                return;
            }
            setIsLoggedIn(true);
        });


    };


    const keyDown = (e: React.KeyboardEvent<HTMLInputElement>) =>
    {
        if (e.key === "Enter") login();
    };

    return (
        <div className={"flex flex-col gap-4"}>
            <h1 className={"text-3xl"}>Login</h1>
            <Input
                id={"username"}
                type={"text"}
                label={"Username"}
                placeholder={"Ex: Store38"}
                value={username}
                onValueChange={setUsername}
                tabIndex={12}
                onKeyDown={keyDown}
                autoFocus
                onClick={e => e.currentTarget.focus()}
                endContent={<FontAwesomeIcon icon={faUser}/>}
                isInvalid={!!usernameError}
                errorMessage={usernameError}
            />
            <Input
                id={"password"}
                type={"password"}
                label={"Password"}
                placeholder={"*********"}
                value={password}
                onValueChange={setPassword}
                tabIndex={13}
                onKeyDown={keyDown}
                onClick={e => e.currentTarget.focus()}
                endContent={<FontAwesomeIcon icon={faLock}/>}
                isInvalid={!!passwordError}
                errorMessage={passwordError}
            />
            <ExtendedSwitch label={"Remember Me?"} toggle={rememberMe} onToggle={setRememberMe} description={"This will keep you logged in for 30 days"} />
            <p className={"text-danger"}>{error}</p>
            <Button color={"primary"} tabIndex={14} variant={"shadow"} onClick={login}>login</Button>
        </div>
    );
}