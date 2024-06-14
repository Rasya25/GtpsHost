# GTPSHost

GTPSHost is a Telegram Bot + WebServer designed for hosting Growtopia Private Server hosts. It allows users to manage their Growtopia server hosts directly through Telegram, offering a convenient and efficient way to handle server administration.

## Features

-   Add and manage Growtopia server hosts via Telegram.
-   Automatic host file generation and management.
-   Easy to use and setup.

## Installation

To get started with GTPSHost, follow these steps:

1. Clone the repository:

```sh
git clone https://github.com/YoruAkio/GTPSHost.git
```

2. Navigate to the project directory:

```sh
cd GTPSHost
```

3. Install the necessary dependencies:

```sh
npm install
```

4. Edit `example.env` and rename it to `.env`:

```sh
cp example.env .env
# Edit .env and add your Telegram Bot Token
```

5. Start the bot:

```sh
node index.js
```

## Usage

After setting up the project, you can interact with the bot on Telegram to manage your Growtopia server hosts. The bot supports various commands for adding, listing, and removing hosts. And for the web server you can access it by visiting `http://localhost:3000`. and this is the endpoints:

```sh
GET /hosts/:hostName
# Example: localhost:3000/hosts/GracePS.txt

```

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request if you have any improvements or new features to suggest.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Acknowledgements

-   Special thanks to [YoruAkio](https://github.com/YoruAkio) for creating and maintaining this project.
-   Inspired by [GTPS.FUN](https://t.me/GTPSHostMaker_bot) GTPS Host Maker Bot by RvLnd and Molk4.

## Contact

If you have any questions or concerns, feel free to contact me on Telegram: [@YoruAkio](https://t.me/YoruAkio) or email me at [YoruAkio](mailto:yoruakio@proton.me).

```

```
