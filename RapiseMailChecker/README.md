# Checking Email in Rapise
Here you can find simple utility function and method for using it.

## Function

````javascript
/**
 * Check speicified mailbox for a new mail message. We only check unread messages and
 * found messages are marked as read.
 * Please, note that for Gmail mailbox you need to set "Allow less secure apps: ON"
 */
function CheckForMail(
	/**string*/imapSvr, 
	/**string*/port, 
	/**string*/emailAddr, 
	/**string*/pwd,
	/**string*/folder,
	/**string*/subjectPattern,
	/**number*/timeout)
````

## Using from RVL
![From RVL](Media/CallingFromRvl.png)

## Extracting Link
It is common that we need to extract registration link from email text. This code also includes simple function to find such a link:

````javascript
/**
 * Check 'body' text and extract all links starting form http:// or https:// and return
 * the first one having 'linkText' as a substring. Otherwise null is returned.
 *
 * Example Usage:
 *  var link = FindLinkHaving(emailBody, 'https://mysite.com/welcome/');
 */
function FindLinkHaving(/**string*/body, /**string*/linkText)
````

## Command Line Utility
The function calls a command line utility attached here as an executable.

The command line utility is needed to access IMAP inbox and read an incoming email



````
RapiseImapClient.exe
Rapise Email Reader
Usage:
RapiseImapClient /imap:<imapsvr> /port:<port> /user:<emailAddr> /password:<password> /command:<cmd> [/folder:<mbfolder>] [/days:<d>] [/unread] [/mark] [/output:<file>]
    /imap:<imapsvr>
        connect to <imapsvr> server (i.e. imap.gmail.com)
    /port:<port>
        Imap port number, i.e. 143
    /user:<emailAddr>
        <emailAddr> - Imap account login
    /password:<password>
        Imap account password
    /folder:<mbfolder>
        Folder to read, default is INBOX   

    /command:<cmd>
      <cmd> is one of:
        get     - read item by id
        list    - list item headers and ID's
    These options are only valid with 'get' command:
    /id:<msgUid>
    These options are only valid with 'list' command:
    /days:<d>
        Number of days in the past to look up, default is 1

    /mark
        Mark found item as read
    /unread
        Only look at unread messages



    /output:<file>
        <file> - path to file to save found message(s) in JSON format

Exit code:
0 when successful, 1 - message with UID not found, 2 no connection to mailbox

Examples:

Get unread items for last 3 days:
    RapiseImapClient.exe /imap:imap.gmail.com /port:993 /user:user@gmail.org /password:secret /folder:INBOX /command:list /unread /days:3 /output:file.json

Get unread items for last 3 days:
    RapiseImapClient.exe /imap:imap.gmail.com /port:993 /user:user@gmail.org /password:secret /folder:INBOX /command:get /id:148 /output:msg.json
````

## Enable Insecure Access for to Gmail

There is one special case. If your mailbox is Gmail then 

*Google Account -> Sign-in & security -> (scroll to bottom) -> Allow less secure apps: ON*

![On](Media/InsecureAccess.png)



