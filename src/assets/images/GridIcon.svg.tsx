interface GridIconIconProperties
{
    width?: number | string;
    height?: number | string;
    size?: number | string;
    fill?: string;
}

export default function GridIcon(props: GridIconIconProperties)
{
    return (
        <svg width={props.size || props.width || "15"} height={props.size || props.height || "15"} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.05556 6.72222H5.16667C6.02222 6.72222 6.72222 6.02222 6.72222 5.16667V2.05556C6.72222 1.2 6.02222 0.5 5.16667 0.5H2.05556C1.2 0.5 0.5 1.2 0.5 2.05556V5.16667C0.5 6.02222 1.2 6.72222 2.05556 6.72222Z" fill={props.fill || "currentColor"}/>
            <path d="M2.05556 14.5H5.16667C6.02222 14.5 6.72222 13.8 6.72222 12.9444V9.83333C6.72222 8.97778 6.02222 8.27778 5.16667 8.27778H2.05556C1.2 8.27778 0.5 8.97778 0.5 9.83333V12.9444C0.5 13.8 1.2 14.5 2.05556 14.5Z" fill={props.fill || "currentColor"}/>
            <path d="M8.27778 2.05556V5.16667C8.27778 6.02222 8.97778 6.72222 9.83333 6.72222H12.9444C13.8 6.72222 14.5 6.02222 14.5 5.16667V2.05556C14.5 1.2 13.8 0.5 12.9444 0.5H9.83333C8.97778 0.5 8.27778 1.2 8.27778 2.05556Z" fill={props.fill || "currentColor"}/>
            <path d="M9.83333 14.5H12.9444C13.8 14.5 14.5 13.8 14.5 12.9444V9.83333C14.5 8.97778 13.8 8.27778 12.9444 8.27778H9.83333C8.97778 8.27778 8.27778 8.97778 8.27778 9.83333V12.9444C8.27778 13.8 8.97778 14.5 9.83333 14.5Z" fill={props.fill || "currentColor"}/>
        </svg>
    );
}