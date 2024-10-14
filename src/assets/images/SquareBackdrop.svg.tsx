interface SquareBackdropIconProperties
{
    width?: number | string;
    height?: number | string;
    size?: number | string;
    fill?: string;
}

export default function SquareBackdrop(props: SquareBackdropIconProperties)
{
    return (
        <svg width={props.size ?? props.width ?? "464"} height={props.size ?? props.height ?? "365"} viewBox="0 0 464 365" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_142_5613)">
                <path d="M376.596 95.7648L374.324 4.11621H403.835L401.895 95.7648H376.596ZM375.186 107.801H402.956V132.255H375.186V107.801Z" fill={props.fill ?? "#DE262E"}/>
                <path d="M274.95 227.916L306.168 182.373L304.626 237.565L356.651 219.063L322.979 262.815L375.949 278.415L322.979 294.016L356.651 337.768L304.626 319.266L306.168 374.457L274.95 328.898L243.748 374.457L245.273 319.266L193.265 337.768L226.937 294.016L173.967 278.415L226.937 262.815L193.265 219.063L245.273 237.565L243.748 182.373L274.95 227.916Z" fill={props.fill ?? "#DE262E"}/>
                <path
                    d="M254.591 169.06L221.814 121.213L189.038 169.06L190.695 111.034L135.985 130.465L171.364 84.5076L115.742 68.1939L171.381 51.8636L136.001 5.84035L190.579 25.3372L188.922 -32.6892L221.698 15.1577L254.591 -32.6892L252.933 25.3372L307.644 5.89009L272.247 51.8636L327.887 68.2602L272.247 84.6402L307.627 130.531L252.916 111.1L254.591 169.06ZM221.814 116.14L251.441 159.395L249.998 106.972L299.387 124.562L267.406 82.9989L317.707 68.1939L267.406 53.3723L299.387 11.8254L249.998 29.3991L251.441 -23.0237L221.814 20.2309L192.237 -23.0237L193.696 29.3991L144.158 11.8254L176.139 53.3723L125.921 68.1939L176.222 82.9989L144.158 124.562L193.564 106.972L192.237 159.395L221.814 116.14Z"
                    fill={props.fill ?? "#DE262E"}/>
                <path
                    d="M66.4857 118.18C67.8728 116.151 69.8798 114.626 72.2061 113.833C74.5325 113.041 77.053 113.023 79.3902 113.783C81.7275 114.543 83.7557 116.039 85.1713 118.048C86.5868 120.057 87.3135 122.471 87.2426 124.927C87.1623 127.943 88.2815 130.867 90.3546 133.058C92.4278 135.249 95.2855 136.529 98.3008 136.615C99.7056 136.646 101.104 136.421 102.429 135.952C104.744 135.125 107.264 135.07 109.612 135.796C111.961 136.521 114.011 137.988 115.456 139.976C116.901 141.964 117.663 144.367 117.628 146.825C117.593 149.282 116.762 151.663 115.261 153.609C114.132 155.073 113.376 156.789 113.06 158.611C112.744 160.432 112.877 162.303 113.446 164.062C114.016 165.821 115.006 167.414 116.331 168.704C117.655 169.994 119.274 170.941 121.047 171.464C123.402 172.159 125.469 173.596 126.939 175.563C128.41 177.529 129.204 179.918 129.204 182.373C129.204 184.829 128.41 187.218 126.939 189.184C125.469 191.15 123.402 192.588 121.047 193.282C118.156 194.139 115.723 196.107 114.281 198.755C112.839 201.403 112.506 204.514 113.354 207.408C113.75 208.76 114.397 210.025 115.261 211.138C116.755 213.085 117.579 215.462 117.611 217.916C117.642 220.37 116.879 222.768 115.435 224.752C113.992 226.736 111.945 228.201 109.601 228.926C107.257 229.652 104.741 229.6 102.429 228.778C99.5819 227.769 96.4506 227.932 93.7239 229.232C90.9972 230.531 88.8984 232.861 87.8892 235.708C87.4276 237.028 87.2086 238.421 87.2426 239.82C87.3135 242.276 86.5868 244.69 85.1713 246.699C83.7557 248.708 81.7275 250.204 79.3902 250.964C77.053 251.724 74.5325 251.706 72.2061 250.913C69.8798 250.121 67.8728 248.596 66.4857 246.567C65.4413 245.042 64.041 243.795 62.4059 242.933C60.7709 242.071 58.9504 241.62 57.102 241.62C55.2536 241.62 53.4331 242.071 51.798 242.933C50.163 243.795 48.7627 245.042 47.7183 246.567C46.3311 248.596 44.3242 250.121 41.9978 250.913C39.6715 251.706 37.151 251.724 34.8138 250.964C32.4765 250.204 30.4483 248.708 29.0327 246.699C27.6171 244.69 26.8904 242.276 26.9614 239.82C27.0138 237.973 26.6154 236.141 25.8007 234.482C24.986 232.824 23.7796 231.389 22.2858 230.302C20.7919 229.214 19.0556 228.507 17.2272 228.242C15.3987 227.976 13.533 228.16 11.7916 228.778C9.47949 229.6 6.96354 229.652 4.61939 228.926C2.27524 228.201 0.228631 226.736 -1.21489 224.752C-2.65841 222.768 -3.42141 220.37 -3.38998 217.916C-3.35855 215.462 -2.53438 213.085 -1.04051 211.138C-0.127348 209.955 0.543513 208.604 0.933637 207.162C1.32376 205.72 1.42548 204.215 1.23297 202.733C1.04045 201.252 0.557492 199.823 -0.188248 198.528C-0.933987 197.234 -1.92785 196.099 -3.11288 195.189C-4.22542 194.325 -5.49095 193.678 -6.84315 193.282C-9.19812 192.588 -11.2652 191.15 -12.7354 189.184C-14.2057 187.218 -15.0002 184.829 -15.0002 182.373C-15.0002 179.918 -14.2057 177.529 -12.7354 175.563C-11.2652 173.596 -9.19812 172.159 -6.84315 171.464C-5.06618 170.947 -3.4427 170.002 -2.11401 168.714C-0.785333 167.425 0.208275 165.831 0.780319 164.071C1.35236 162.311 1.4855 160.438 1.16815 158.614C0.850806 156.791 0.0925853 155.072 -1.04051 153.609C-2.54179 151.663 -3.37218 149.282 -3.40733 146.825C-3.44247 144.367 -2.68047 141.964 -1.23545 139.976C0.209569 137.988 2.25984 136.521 4.6083 135.796C6.95676 135.07 9.47702 135.125 11.7916 135.952C13.5317 136.569 15.3958 136.753 17.2229 136.489C19.05 136.224 20.7853 135.518 22.2787 134.433C23.7722 133.348 24.9789 131.915 25.7948 130.259C26.6106 128.603 27.011 126.773 26.9614 124.927C26.8904 122.471 27.6171 120.057 29.0327 118.048C30.4483 116.039 32.4765 114.543 34.8138 113.783C37.151 113.023 39.6715 113.041 41.9978 113.833C44.3242 114.626 46.3311 116.151 47.7183 118.18C48.7627 119.705 50.163 120.952 51.798 121.814C53.4331 122.676 55.2536 123.127 57.102 123.127C58.9504 123.127 60.7709 122.676 62.4059 121.814C64.041 120.952 65.4413 119.705 66.4857 118.18Z"
                    fill={props.fill ?? "#DE262E"}/>
                <path d="M458.098 252.105H417.794L411.876 155.814H464L458.098 252.105ZM416.302 301.842V260.394H459.739V301.842H416.302Z" fill={props.fill ?? "#DE262E"}/>
                <path d="M109.442 280.405C111.846 285.578 111.481 294.646 103.904 308.324C93.7416 326.561 78.2071 355.64 68.7902 376.165C67.8452 378.005 67.1323 378.37 65.6402 376.895C62.8715 373.944 61.0147 367.842 65.0765 356.751C72.4707 336.972 90.9563 300.383 104.866 280.04C106.308 277.819 108.348 277.819 109.442 280.405Z" fill={props.fill ?? "#DE262E"}/>
            </g>
            <defs>
                <clipPath id="clip0_142_5613">
                    <rect width="479" height="430.158" fill="white" transform="translate(-15 -32.6892)"/>
                </clipPath>
            </defs>
        </svg>

    );
}