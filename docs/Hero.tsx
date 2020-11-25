import cx from 'classnames'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <div className={cx(styles.wrapper, 'flex justify-center')}>
      <div className="container">
        <svg
          width="200"
          height="286"
          viewBox="0 0 200 286"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M33.3585 0.251801C10.1965 0.251801 -0.231995 10.723 -0.231995 33.7092V377.291C-0.231995 400.277 10.1965 410.748 33.3585 410.748H166.59C188.949 410.748 200.181 399.467 200.181 377.291V33.7092C200.181 10.723 189.752 0.251801 166.59 0.251801H33.3585Z"
            fill="#592340"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M49.2421 13.2667C49.2421 17.8967 52.6614 23.5577 60.5289 23.5577H138.892C146.759 23.5577 150.179 17.8967 150.179 13.4275C150.179 11.1996 150.179 9.08594 153.887 9.08594H169.527C182.598 9.08594 190.489 16.9546 190.489 29.9897V379.564C190.489 392.599 182.598 400.468 169.527 400.468H30.0545C16.9836 400.468 9.09331 392.599 9.09331 379.564V29.9897C9.09331 16.9546 16.9836 9.08594 30.0545 9.08594H45.5336C49.2421 9.08594 49.2421 11.1996 49.2421 13.2667Z"
            fill="#FC9EC2"
          />
          <path
            d="M9 99.75C9 93.4642 9 90.3213 9.92713 87.8082C11.4459 83.6913 14.6913 80.4459 18.8082 78.9271C21.3213 78 24.4642 78 30.75 78H169.25C175.536 78 178.679 78 181.192 78.9271C185.309 80.4459 188.554 83.6913 190.073 87.8082C191 90.3213 191 93.4642 191 99.75V372C191 380.381 191 384.572 189.764 387.922C187.739 393.412 183.412 397.739 177.922 399.764C174.572 401 170.381 401 162 401H38C29.619 401 25.4285 401 22.0777 399.764C16.5884 397.739 12.2613 393.412 10.2362 387.922C9 384.572 9 380.381 9 372V99.75Z"
            fill="white"
          />
          <path
            d="M34.424 121.368H32.376V127H24.824V104.6H35.608C37.6773 104.6 39.48 104.941 41.016 105.624C42.552 106.307 43.736 107.288 44.568 108.568C45.4 109.848 45.816 111.341 45.816 113.048C45.816 114.648 45.4533 116.045 44.728 117.24C44.0027 118.435 42.9573 119.384 41.592 120.088L46.296 127H38.232L34.424 121.368ZM38.2 113.048C38.2 112.216 37.944 111.576 37.432 111.128C36.92 110.659 36.152 110.424 35.128 110.424H32.376V115.672H35.128C36.152 115.672 36.92 115.448 37.432 115C37.944 114.531 38.2 113.88 38.2 113.048ZM67.0678 118.232C67.0678 118.339 67.0358 118.904 66.9718 119.928H54.8118C55.0678 120.589 55.4944 121.101 56.0918 121.464C56.6891 121.805 57.4358 121.976 58.3318 121.976C59.0998 121.976 59.7398 121.88 60.2518 121.688C60.7851 121.496 61.3611 121.165 61.9798 120.696L65.7558 124.504C64.0491 126.381 61.4998 127.32 58.1078 127.32C55.9958 127.32 54.1398 126.936 52.5398 126.168C50.9398 125.379 49.7024 124.291 48.8278 122.904C47.9531 121.517 47.5158 119.96 47.5158 118.232C47.5158 116.483 47.9424 114.925 48.7958 113.56C49.6704 112.173 50.8544 111.096 52.3478 110.328C53.8624 109.56 55.5584 109.176 57.4358 109.176C59.2064 109.176 60.8171 109.528 62.2678 110.232C63.7398 110.936 64.9024 111.971 65.7558 113.336C66.6304 114.701 67.0678 116.333 67.0678 118.232ZM57.4998 114.104C56.7531 114.104 56.1344 114.307 55.6438 114.712C55.1531 115.117 54.8331 115.693 54.6838 116.44H60.3158C60.1664 115.715 59.8464 115.149 59.3558 114.744C58.8651 114.317 58.2464 114.104 57.4998 114.104ZM76.7213 109.176C79.7933 109.176 82.1399 109.869 83.7613 111.256C85.3826 112.621 86.1933 114.733 86.1933 117.592V127H79.4733V124.696C78.6413 126.445 76.9879 127.32 74.5133 127.32C73.1266 127.32 71.9426 127.085 70.9613 126.616C70.0013 126.125 69.2653 125.475 68.7533 124.664C68.2626 123.832 68.0173 122.904 68.0173 121.88C68.0173 120.152 68.6786 118.84 70.0013 117.944C71.3239 117.048 73.3293 116.6 76.0173 116.6H78.9293C78.6946 115.235 77.5959 114.552 75.6333 114.552C74.8439 114.552 74.0439 114.68 73.2333 114.936C72.4226 115.171 71.7293 115.501 71.1533 115.928L68.8493 111.16C69.8519 110.541 71.0573 110.061 72.4653 109.72C73.8946 109.357 75.3133 109.176 76.7213 109.176ZM76.6892 122.968C77.2013 122.968 77.6599 122.829 78.0653 122.552C78.4706 122.275 78.7693 121.859 78.9613 121.304V120.088H77.1693C75.6973 120.088 74.9613 120.579 74.9613 121.56C74.9613 121.965 75.1106 122.307 75.4093 122.584C75.7293 122.84 76.1559 122.968 76.6892 122.968ZM99.0393 127.32C97.0553 127.32 95.2739 126.936 93.6953 126.168C92.1379 125.4 90.9113 124.323 90.0153 122.936C89.1406 121.549 88.7033 119.981 88.7033 118.232C88.7033 116.483 89.1406 114.925 90.0153 113.56C90.9113 112.173 92.1379 111.096 93.6953 110.328C95.2739 109.56 97.0553 109.176 99.0393 109.176C101.173 109.176 102.997 109.635 104.511 110.552C106.026 111.469 107.071 112.739 107.647 114.36L102.047 117.112C101.365 115.576 100.351 114.808 99.0073 114.808C98.1539 114.808 97.4393 115.107 96.8633 115.704C96.3086 116.301 96.0312 117.144 96.0312 118.232C96.0312 119.341 96.3086 120.195 96.8633 120.792C97.4393 121.389 98.1539 121.688 99.0073 121.688C100.351 121.688 101.365 120.92 102.047 119.384L107.647 122.136C107.071 123.757 106.026 125.027 104.511 125.944C102.997 126.861 101.173 127.32 99.0393 127.32ZM122.527 126.392C121.439 127.011 119.957 127.32 118.079 127.32C115.626 127.32 113.738 126.733 112.415 125.56C111.093 124.365 110.431 122.584 110.431 120.216V115.736H108.031V110.456H110.431V105.56H117.663V110.456H121.247V115.736H117.663V120.152C117.663 120.685 117.802 121.101 118.079 121.4C118.357 121.699 118.719 121.848 119.167 121.848C119.786 121.848 120.33 121.688 120.799 121.368L122.527 126.392ZM33.176 173.512C31.32 173.512 29.5067 173.309 27.736 172.904C25.9867 172.477 24.5467 171.912 23.416 171.208L25.848 165.704C26.9147 166.323 28.1093 166.824 29.432 167.208C30.7547 167.571 32.024 167.752 33.24 167.752C34.2853 167.752 35.032 167.656 35.48 167.464C35.928 167.251 36.152 166.941 36.152 166.536C36.152 166.067 35.8533 165.715 35.256 165.48C34.68 165.245 33.72 164.989 32.376 164.712C30.648 164.349 29.208 163.965 28.056 163.56C26.904 163.133 25.9013 162.451 25.048 161.512C24.1947 160.552 23.768 159.261 23.768 157.64C23.768 156.232 24.1627 154.952 24.952 153.8C25.7413 152.648 26.9147 151.741 28.472 151.08C30.0507 150.419 31.96 150.088 34.2 150.088C35.736 150.088 37.24 150.259 38.712 150.6C40.2053 150.92 41.5173 151.4 42.648 152.04L40.376 157.512C38.1787 156.403 36.0987 155.848 34.136 155.848C32.1947 155.848 31.224 156.317 31.224 157.256C31.224 157.704 31.512 158.045 32.088 158.28C32.664 158.493 33.6133 158.728 34.936 158.984C36.6427 159.304 38.0827 159.677 39.256 160.104C40.4293 160.509 41.4427 161.181 42.296 162.12C43.1707 163.059 43.608 164.339 43.608 165.96C43.608 167.368 43.2133 168.648 42.424 169.8C41.6347 170.931 40.4507 171.837 38.872 172.52C37.3147 173.181 35.416 173.512 33.176 173.512ZM57.3113 155.176C58.8473 155.176 60.2553 155.549 61.5353 156.296C62.8366 157.021 63.8606 158.077 64.6073 159.464C65.3753 160.851 65.7593 162.451 65.7593 164.264C65.7593 166.077 65.3753 167.677 64.6073 169.064C63.8606 170.429 62.8366 171.485 61.5353 172.232C60.2553 172.957 58.8473 173.32 57.3113 173.32C55.3699 173.32 53.8873 172.819 52.8633 171.816V179.208H45.6313V155.496H52.5113V156.936C53.5566 155.763 55.1566 155.176 57.3113 155.176ZM55.5833 167.688C56.4153 167.688 57.0979 167.389 57.6313 166.792C58.1646 166.195 58.4313 165.352 58.4313 164.264C58.4313 163.176 58.1646 162.333 57.6313 161.736C57.0979 161.117 56.4153 160.808 55.5833 160.808C54.7513 160.808 54.0686 161.117 53.5353 161.736C53.0019 162.333 52.7353 163.176 52.7353 164.264C52.7353 165.352 53.0019 166.195 53.5353 166.792C54.0686 167.389 54.7513 167.688 55.5833 167.688ZM74.9175 157.384C76.1975 155.912 78.0855 155.176 80.5815 155.176V161.576C80.0055 161.491 79.4722 161.448 78.9815 161.448C76.5068 161.448 75.2695 162.707 75.2695 165.224V173H68.0375V155.496H74.9175V157.384ZM82.6313 155.496H89.8633V173H82.6313V155.496ZM86.2473 154.088C84.9459 154.088 83.8899 153.747 83.0793 153.064C82.2899 152.36 81.8953 151.475 81.8953 150.408C81.8953 149.341 82.2899 148.467 83.0793 147.784C83.8899 147.08 84.9459 146.728 86.2473 146.728C87.5699 146.728 88.6259 147.059 89.4153 147.72C90.2046 148.381 90.5993 149.235 90.5993 150.28C90.5993 151.389 90.2046 152.307 89.4153 153.032C88.6259 153.736 87.5699 154.088 86.2473 154.088ZM105.229 155.176C107.383 155.176 109.111 155.827 110.413 157.128C111.735 158.429 112.397 160.392 112.397 163.016V173H105.165V164.264C105.165 162.259 104.45 161.256 103.021 161.256C102.21 161.256 101.549 161.544 101.037 162.12C100.546 162.675 100.301 163.56 100.301 164.776V173H93.0688V155.496H99.9488V157.224C100.631 156.541 101.421 156.029 102.317 155.688C103.213 155.347 104.183 155.176 105.229 155.176ZM135.402 155.496V169.512C135.402 172.84 134.474 175.336 132.618 177C130.783 178.685 128.159 179.528 124.746 179.528C122.997 179.528 121.365 179.336 119.85 178.952C118.335 178.589 117.045 178.056 115.978 177.352L118.41 172.424C119.093 172.936 119.957 173.352 121.002 173.672C122.047 173.992 123.05 174.152 124.01 174.152C125.461 174.152 126.517 173.843 127.178 173.224C127.839 172.605 128.17 171.699 128.17 170.504V170.184C127.082 171.421 125.471 172.04 123.338 172.04C121.845 172.04 120.447 171.699 119.146 171.016C117.866 170.312 116.842 169.32 116.074 168.04C115.306 166.739 114.922 165.256 114.922 163.592C114.922 161.928 115.306 160.456 116.074 159.176C116.842 157.896 117.866 156.915 119.146 156.232C120.447 155.528 121.845 155.176 123.338 155.176C125.727 155.176 127.455 155.944 128.522 157.48V155.496H135.402ZM125.258 166.408C126.111 166.408 126.815 166.152 127.37 165.64C127.946 165.107 128.234 164.424 128.234 163.592C128.234 162.76 127.946 162.088 127.37 161.576C126.815 161.064 126.111 160.808 125.258 160.808C124.383 160.808 123.658 161.064 123.082 161.576C122.527 162.088 122.25 162.76 122.25 163.592C122.25 164.424 122.538 165.107 123.114 165.64C123.69 166.152 124.405 166.408 125.258 166.408ZM42.744 207.288C44.0667 207.779 45.0907 208.493 45.816 209.432C46.5413 210.371 46.904 211.501 46.904 212.824C46.904 214.787 46.0933 216.312 44.472 217.4C42.8507 218.467 40.504 219 37.432 219H24.824V196.6H36.792C39.7787 196.6 42.0293 197.133 43.544 198.2C45.08 199.267 45.848 200.685 45.848 202.456C45.848 203.501 45.5813 204.44 45.048 205.272C44.536 206.104 43.768 206.776 42.744 207.288ZM32.248 201.88V205.208H35.768C37.4107 205.208 38.232 204.653 38.232 203.544C38.232 202.435 37.4107 201.88 35.768 201.88H32.248ZM36.792 213.72C38.456 213.72 39.288 213.133 39.288 211.96C39.288 210.787 38.456 210.2 36.792 210.2H32.248V213.72H36.792ZM58.598 219.32C56.6567 219.32 54.9073 218.936 53.35 218.168C51.814 217.379 50.6087 216.301 49.734 214.936C48.8593 213.549 48.422 211.981 48.422 210.232C48.422 208.483 48.8593 206.925 49.734 205.56C50.6087 204.173 51.814 203.096 53.35 202.328C54.9073 201.56 56.6567 201.176 58.598 201.176C60.5607 201.176 62.31 201.56 63.846 202.328C65.4033 203.096 66.6087 204.173 67.462 205.56C68.3367 206.925 68.774 208.483 68.774 210.232C68.774 211.981 68.3367 213.549 67.462 214.936C66.6087 216.301 65.4033 217.379 63.846 218.168C62.31 218.936 60.5607 219.32 58.598 219.32ZM58.598 213.688C59.43 213.688 60.1127 213.389 60.646 212.792C61.1793 212.173 61.446 211.32 61.446 210.232C61.446 209.144 61.1793 208.301 60.646 207.704C60.1127 207.107 59.43 206.808 58.598 206.808C57.766 206.808 57.0833 207.107 56.55 207.704C56.0167 208.301 55.75 209.144 55.75 210.232C55.75 211.32 56.0167 212.173 56.55 212.792C57.0833 213.389 57.766 213.688 58.598 213.688ZM83.9335 218.392C82.8455 219.011 81.3628 219.32 79.4855 219.32C77.0322 219.32 75.1442 218.733 73.8215 217.56C72.4988 216.365 71.8375 214.584 71.8375 212.216V207.736H69.4375V202.456H71.8375V197.56H79.0695V202.456H82.6535V207.736H79.0695V212.152C79.0695 212.685 79.2082 213.101 79.4855 213.4C79.7628 213.699 80.1255 213.848 80.5735 213.848C81.1922 213.848 81.7362 213.688 82.2055 213.368L83.9335 218.392ZM98.3398 218.392C97.2518 219.011 95.7691 219.32 93.8918 219.32C91.4384 219.32 89.5504 218.733 88.2278 217.56C86.9051 216.365 86.2438 214.584 86.2438 212.216V207.736H83.8438V202.456H86.2438V197.56H93.4758V202.456H97.0598V207.736H93.4758V212.152C93.4758 212.685 93.6144 213.101 93.8918 213.4C94.1691 213.699 94.5318 213.848 94.9798 213.848C95.5984 213.848 96.1424 213.688 96.6118 213.368L98.3398 218.392ZM108.942 219.32C107 219.32 105.251 218.936 103.694 218.168C102.158 217.379 100.952 216.301 100.078 214.936C99.2031 213.549 98.7658 211.981 98.7658 210.232C98.7658 208.483 99.2031 206.925 100.078 205.56C100.952 204.173 102.158 203.096 103.694 202.328C105.251 201.56 107 201.176 108.942 201.176C110.904 201.176 112.654 201.56 114.19 202.328C115.747 203.096 116.952 204.173 117.806 205.56C118.68 206.925 119.118 208.483 119.118 210.232C119.118 211.981 118.68 213.549 117.806 214.936C116.952 216.301 115.747 217.379 114.19 218.168C112.654 218.936 110.904 219.32 108.942 219.32ZM108.942 213.688C109.774 213.688 110.456 213.389 110.99 212.792C111.523 212.173 111.79 211.32 111.79 210.232C111.79 209.144 111.523 208.301 110.99 207.704C110.456 207.107 109.774 206.808 108.942 206.808C108.11 206.808 107.427 207.107 106.894 207.704C106.36 208.301 106.094 209.144 106.094 210.232C106.094 211.32 106.36 212.173 106.894 212.792C107.427 213.389 108.11 213.688 108.942 213.688ZM144.549 201.176C146.661 201.176 148.347 201.827 149.605 203.128C150.885 204.429 151.525 206.392 151.525 209.016V219H144.293V210.264C144.293 208.259 143.643 207.256 142.341 207.256C141.659 207.256 141.104 207.512 140.677 208.024C140.272 208.536 140.069 209.347 140.069 210.456V219H132.837V210.264C132.837 208.259 132.187 207.256 130.885 207.256C130.203 207.256 129.648 207.512 129.221 208.024C128.816 208.536 128.613 209.347 128.613 210.456V219H121.381V201.496H128.261V203.128C129.563 201.827 131.216 201.176 133.221 201.176C134.395 201.176 135.451 201.4 136.389 201.848C137.328 202.275 138.096 202.936 138.693 203.832C139.397 202.979 140.251 202.328 141.253 201.88C142.256 201.411 143.355 201.176 144.549 201.176ZM33.176 265.512C31.32 265.512 29.5067 265.309 27.736 264.904C25.9867 264.477 24.5467 263.912 23.416 263.208L25.848 257.704C26.9147 258.323 28.1093 258.824 29.432 259.208C30.7547 259.571 32.024 259.752 33.24 259.752C34.2853 259.752 35.032 259.656 35.48 259.464C35.928 259.251 36.152 258.941 36.152 258.536C36.152 258.067 35.8533 257.715 35.256 257.48C34.68 257.245 33.72 256.989 32.376 256.712C30.648 256.349 29.208 255.965 28.056 255.56C26.904 255.133 25.9013 254.451 25.048 253.512C24.1947 252.552 23.768 251.261 23.768 249.64C23.768 248.232 24.1627 246.952 24.952 245.8C25.7413 244.648 26.9147 243.741 28.472 243.08C30.0507 242.419 31.96 242.088 34.2 242.088C35.736 242.088 37.24 242.259 38.712 242.6C40.2053 242.92 41.5173 243.4 42.648 244.04L40.376 249.512C38.1787 248.403 36.0987 247.848 34.136 247.848C32.1947 247.848 31.224 248.317 31.224 249.256C31.224 249.704 31.512 250.045 32.088 250.28C32.664 250.493 33.6133 250.728 34.936 250.984C36.6427 251.304 38.0827 251.677 39.256 252.104C40.4293 252.509 41.4427 253.181 42.296 254.12C43.1707 255.059 43.608 256.339 43.608 257.96C43.608 259.368 43.2133 260.648 42.424 261.8C41.6347 262.931 40.4507 263.837 38.872 264.52C37.3147 265.181 35.416 265.512 33.176 265.512ZM57.7913 247.176C59.9459 247.176 61.6739 247.827 62.9753 249.128C64.2979 250.429 64.9593 252.392 64.9593 255.016V265H57.7273V256.264C57.7273 254.259 57.0126 253.256 55.5833 253.256C54.7726 253.256 54.1113 253.544 53.5993 254.12C53.1086 254.675 52.8633 255.56 52.8633 256.776V265H45.6313V241.256H52.8633V248.904C54.2073 247.752 55.8499 247.176 57.7913 247.176ZM87.0365 256.232C87.0365 256.339 87.0045 256.904 86.9405 257.928H74.7805C75.0365 258.589 75.4632 259.101 76.0605 259.464C76.6578 259.805 77.4045 259.976 78.3005 259.976C79.0685 259.976 79.7085 259.88 80.2205 259.688C80.7538 259.496 81.3298 259.165 81.9485 258.696L85.7245 262.504C84.0178 264.381 81.4685 265.32 78.0765 265.32C75.9645 265.32 74.1085 264.936 72.5085 264.168C70.9085 263.379 69.6712 262.291 68.7965 260.904C67.9218 259.517 67.4845 257.96 67.4845 256.232C67.4845 254.483 67.9112 252.925 68.7645 251.56C69.6392 250.173 70.8232 249.096 72.3165 248.328C73.8312 247.56 75.5272 247.176 77.4045 247.176C79.1752 247.176 80.7858 247.528 82.2365 248.232C83.7085 248.936 84.8712 249.971 85.7245 251.336C86.5992 252.701 87.0365 254.333 87.0365 256.232ZM77.4685 252.104C76.7218 252.104 76.1032 252.307 75.6125 252.712C75.1218 253.117 74.8018 253.693 74.6525 254.44H80.2845C80.1352 253.715 79.8152 253.149 79.3245 252.744C78.8338 252.317 78.2152 252.104 77.4685 252.104ZM107.943 256.232C107.943 256.339 107.911 256.904 107.847 257.928H95.6868C95.9428 258.589 96.3694 259.101 96.9668 259.464C97.5641 259.805 98.3108 259.976 99.2068 259.976C99.9748 259.976 100.615 259.88 101.127 259.688C101.66 259.496 102.236 259.165 102.855 258.696L106.631 262.504C104.924 264.381 102.375 265.32 98.9828 265.32C96.8708 265.32 95.0148 264.936 93.4148 264.168C91.8148 263.379 90.5774 262.291 89.7028 260.904C88.8281 259.517 88.3908 257.96 88.3908 256.232C88.3908 254.483 88.8174 252.925 89.6708 251.56C90.5454 250.173 91.7294 249.096 93.2228 248.328C94.7374 247.56 96.4334 247.176 98.3108 247.176C100.081 247.176 101.692 247.528 103.143 248.232C104.615 248.936 105.777 249.971 106.631 251.336C107.505 252.701 107.943 254.333 107.943 256.232ZM98.3748 252.104C97.6281 252.104 97.0094 252.307 96.5188 252.712C96.0281 253.117 95.7081 253.693 95.5588 254.44H101.191C101.041 253.715 100.721 253.149 100.231 252.744C99.7401 252.317 99.1214 252.104 98.3748 252.104ZM123.121 264.392C122.033 265.011 120.55 265.32 118.673 265.32C116.22 265.32 114.332 264.733 113.009 263.56C111.686 262.365 111.025 260.584 111.025 258.216V253.736H108.625V248.456H111.025V243.56H118.257V248.456H121.841V253.736H118.257V258.152C118.257 258.685 118.396 259.101 118.673 259.4C118.95 259.699 119.313 259.848 119.761 259.848C120.38 259.848 120.924 259.688 121.393 259.368L123.121 264.392Z"
            fill="#592340"
          />
          <rect
            x="89"
            y="85"
            width="22"
            height="2"
            rx="1"
            fill="hsl(328deg 44% 24% / 50%)"
          />
        </svg>
      </div>
    </div>
  )
}
