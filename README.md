# Minimal App Sync Example

This is a minimal App Sync Example using Subscripion.

## Getting Started

### Create AWS resources.

```
$ cd cdk
$ cdk deploy app-sync-example-stack
```

### Subscribe

Get API URL and API Key from a AWS AppSync Settings and put it to environmental variables.

```
$ export API_ENDPOINT="<API_URL>"
$ export API_KEY="<API_KEY>"
```

Run th python script to subscribe.

```
$ cd scripts
$ pipenv install
$ pipenv shell
$ python subscribe.py
```

Now you can see the following message.

```
Host: <YOUR_HOST>
Waiting for messages...
```

### Mutate

Open another terminal and export environmental variables again.

Put a query and exceute to use [gq](https://github.com/hasura/graphqurl).

```
export QUERY='
  mutation AddUser {
    addUser(id: "user1", input: {age: 22, name: "first user"}) {
      age
      id
      name
    }
  }
'
```

```
$ gq ${API_ENDPOINT} -H "x-api-key:${API_KEY}" -q "${QUERY}"
```

```
Executing query... done
{
  "data": {
    "addUser": {
      "age": 22,
      "id": "user1",
      "name": "first user"
    }
  }
}
```

And the subscribed terinal get a message.

```
{'updatedUser': {'age': 22, 'id': 'user1', 'name': 'first user'}}
```
