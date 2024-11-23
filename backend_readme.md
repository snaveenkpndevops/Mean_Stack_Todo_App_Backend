## Backend (Node.js + Express)

FYI: 

  ```
  Frontend Repo URL : https://github.com/snaveenkpndevops/Mean_Stack_Todo_App_Frontend
  ```

Reference from geeks for geeks : https://www.geeksforgeeks.org/todo-list-application-using-mean-stack/

MEAN STACK  --> Mongo Express Angular Node.js

## Installation of node js packages and and code (Also Running the application in Local machine)

1. mkdir backend
2. cd backend

3. npm init -y  --> [To Initialize a new node.js project]

   * This will install `package.json` file

4. npm i express mongoose cors body-parser     --> This will install 3 npm packages (Node.js modules) into your project:

    [ This will create `package-lock.json` and `node_modules` file]

    [ Also This command will update dependencies in `package.json` file. In `package.json` file in dependency field you can see mongoose, express, dotenv dependency along with version.]

    * express --> A web framework for building RESTful APIs or web applications in Node.js. Simplifies server-side logic and routing.

    * mongoose --> An Object Data Modeling (ODM) library for MongoDB and Node.js. Simplifies interaction with MongoDB by providing schema and query-building functionalities.

    what is express? purpose?

    * It is a lightweigt framework, that simplifies the process of creating web application and APIs.
    * Express simplifies request routing, making it easy to define endpoints for different HTTP method (GET, POST, PUT, DELETE etc.)


5. Now we paste the backend code from Geeks for Geeks.

6. node index.js    -->  To start the server run the following command.

   Note:

    * Replace the mongo db url in `dbConfig.js`


7. backend is listening to port `http://localhost:3001/tasks`

8. Note:

        while building the docker Image --> please ensure that in `dbConfig.js` update the mongodb URL 

        * Currently we are using our mongodb in local machine. so i update the mongourl as "mongodb://host.docker.internal:27017/Restaurant_db" in index.js file.
        * If we use mongo as docker container then we need to change the mongourl based on that.

9. Instead of hardcoding the port and Ip address in backend we are getting those info from env variable from kubernetes cluster.

    * For `mongo url` in `dbConfig.js` we modify the hardcoded lines but in this demo we use the hardcoded URL.

            ```
             // dbConfig.js

            import mongoose from 'mongoose';

            // Connection function
            export async function connect() {
                try {
                    // "mongodb://127.0.0.1:27017/Restaurant_db"
                    //"mongodb://root:password@mongodb-container:27017/todo_db?authSource=admin"   --> for mongodb-container
                    // await mongoose.connect("mongodb://root:password@mongodb-service:27017/todo_db?authSource=admin", {
                    await mongoose.connect("mongodb://root:password@mongodb-service:27017/todo_db?authSource=admin", {
                        useNewUrlParser: true,
                        useUnifiedTopology: true
                    });
                    console.log("DB Connected >>>");
                } catch (err) {
                    console.error("Error connecting to DB: ", err);
                    process.exit(1); // Exit the process in case of connection failure
                }
            }

            // Invoke the connect function
            connect();


            ```

## Note:

## Creating Kubernetes pods for the backend application:

### Prerequisite for Testing:

1. make sure your docker-desktop application is running.
2. minikube start   -->  Run this command to start minikube cluster.
3. make sure to login docker in order to push the docker image to docker hub.
 
    `docker commands:`

    ```
    docker login        // login to dockerhub

    docker tag todo-backend:latest snaveenkpn/todo-backend:1    // tag your docker image in order to push the image to dockerhub

    docker push snaveenkpn/todo-backend:1     // push tagged docker image to docker hub

    ```

You can either use minikube cluster (or) Kind cluster.

3. minikube status
4. kubectl get nodes

5. In backend `dbConfig.js` file change the mongo url.

    ```
    // dbConfig.js

    import mongoose from 'mongoose';

    // Connection function
    export async function connect() {
        try {
            // "mongodb://127.0.0.1:27017/Restaurant_db"
            //"mongodb://root:password@mongodb-container:27017/todo_db?authSource=admin"   --> for mongodb-container
            // await mongoose.connect("mongodb://root:password@mongodb-service:27017/todo_db?authSource=admin", {
            await mongoose.connect("mongodb://root:password@mongodb-service:27017/todo_db?authSource=admin", {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log("DB Connected >>>");
        } catch (err) {
            console.error("Error connecting to DB: ", err);
            process.exit(1); // Exit the process in case of connection failure
        }
    }

    // Invoke the connect function
    connect();
    ```

6. Create kubernetes yaml for `mongo-db` and `backend` to be created in `restaurant` namespace. we are passing `MongoURL` from `backend.yaml` file.

    ```
    \\ mongo_db.yaml

    apiVersion: apps/v1
    kind: Deployment
    metadata:
    name: mongodb
    namespace: todo
    labels:
        app: mongodb
    spec:
    replicas: 1
    selector:
        matchLabels:
        app: mongodb
    template:
        metadata:
        labels:
            app: mongodb
        spec:
        containers:
        - name: mongodb
            image: mongo
            ports:
            - containerPort: 27017
            env:
            - name: MONGO_INITDB_ROOT_USERNAME
            value: root
            - name: MONGO_INITDB_ROOT_PASSWORD
            value: password
    ---
    apiVersion: v1
    kind: Service
    metadata:
    name: mongodb-service
    namespace: todo
    spec:
    selector:
        app: mongodb
    ports:
    - protocol: TCP
        port: 27017
        targetPort: 27017
    type: ClusterIP


    ```


    ```
    \\ backend.yaml

    apiVersion: apps/v1
    kind: Deployment
    metadata:
    name: backend
    namespace: todo
    spec:
    replicas: 1
    selector:
        matchLabels:
        app: backend
    template:
        metadata:
        labels:
            app: backend
        spec:
        containers:
        - name: backend
            image: snaveenkpn/todo-backend:1
            ports:
            - containerPort: 3001
            env:
            - name: MONGO_URL
            value: mongodb://root:password@mongodb-service:27017/todo_db?authSource=admin
    ---
    apiVersion: v1
    kind: Service
    metadata:
    name: backend-service
    namespace: todo
    spec:
    selector:
        app: backend
    ports:
    - protocol: TCP
        port: 3001
        targetPort: 3001
    type: ClusterIP


    ```

7. For testing purpose we configured the backend service type as `NodePort`. Once we test that backend and mongodb is working as expected then change the backend service type as `ClusterIP`.

### Checking the Kubernetes backend and MongoDB pods and services.

1. kubectl create ns todo
2. kubectl apply -f mongo_db.yaml
3. kubectl get pods -n todo  -->  Check mongodb pod is running or not.
4. kubectl apply -f backend.yaml
5. kubectl get pods -n todo  -->  Check backend pod is running or not.
6. kubectl logs backend-6bb64c8b6-jrk2n -n todo

   ```
    kubectl logs backend-6bb64c8b6-jrk2n -n todo
    Connected to MongoDB
    Server is running on port 4000
    Restaurant data seeded successfully!

   ```

7. minikube service backend-service -n todo --url   -->  This will show the minikube url and port. Paste that in browser

    ```
    minikube service backend-service -n restaurant --url
    W1121 23:08:41.847561   14352 main.go:291] Unable to resolve the current Docker CLI context "default": context "default": context not found: open C:\Users\Naveen\.docker\contexts\meta\37a8eec1ce19687d132fe29051dca629d164e2c4958ba141d5f4133a33f0688f\meta.json: The system cannot find the path specified.
    http://127.0.0.1:58819
    ❗  Because you are using a Docker driver on windows, the terminal needs to be open to run it.

    ```

8. Paste `http://127.0.0.1:58819/tasks`  in browser.

9. Now If everything works fine then change the backend kubernetes service type to `ClusterIP`.


### Images:

![Backend Logo](./images/localhost%20backend1.png)

### Note:

For kubernetes deployment it is good to use minikube for testing. But the real problem is we will face connection issue  between frontend and backend. Eventhough we pass the backend url correctly to frontend code it still will not connect. So to avoid this problem we need to create a ingress for frontend and backend and then in frontend code we pass the `backend ingress host along with path URL as a api url.` Now both frontend and backend will get connected.

## Steps to deploy our code in eks/aks cluster:

1. Create a Eks Public Cluster.
2. Create a Node Group with spot instance inorder to reduce eks cost.
3. SG --> Allow All Traffic
4. Once Eks cluster and node group created.
5. Open VS CODE terminal  -->  Execute the below commands.

    ```

        * aws configure
        * aws eks update-kubeconfig --region ap-south-1 --name mean-stack-eks 
        * kubectl config current-context 
        * helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
        * helm repo update
        * helm repo add jetstack https://charts.jetstack.io
        * helm repo update
        * helm install ingress-nginx ingress-nginx/ingress-nginx  --create-namespace --namespace ingress-basic --version 4.5.2     
        * helm repo update
        * kubectl create ns todo
        * kubectl apply -f e:\MyHandsonProjects\CICD_Projects\Frontend_backend\mean_stack_simple_todo_app\Kubernetes\mongo_db.yaml -n todo

    ```

    ```
        \\ Mongo_db.yaml

        apiVersion: apps/v1
        kind: Deployment
        metadata:
        name: mongodb
        namespace: todo
        labels:
            app: mongodb
        spec:
        replicas: 1
        selector:
            matchLabels:
            app: mongodb
        template:
            metadata:
            labels:
                app: mongodb
            spec:
            containers:
            - name: mongodb
                image: mongo
                ports:
                - containerPort: 27017
                env:
                - name: MONGO_INITDB_ROOT_USERNAME
                value: root
                - name: MONGO_INITDB_ROOT_PASSWORD
                value: password
        ---
        apiVersion: v1
        kind: Service
        metadata:
        name: mongodb-service
        namespace: todo
        spec:
        selector:
            app: mongodb
        ports:
        - protocol: TCP
            port: 27017
            targetPort: 27017
        type: ClusterIP



    ```

        * kubectl apply -f e:\MyHandsonProjects\CICD_Projects\Frontend_backend\mean_stack_simple_todo_app\Kubernetes\backend.yaml -n todo

    ```
        \\ backend.yaml

        apiVersion: apps/v1
        kind: Deployment
        metadata:
        name: backend
        namespace: todo
        spec:
        replicas: 1
        selector:
            matchLabels:
            app: backend
        template:
            metadata:
            labels:
                app: backend
            spec:
            containers:
            - name: backend
                image: snaveenkpn/todo-backend:1
                ports:
                - containerPort: 3001
                env:
                - name: MONGO_URL
                value: mongodb://root:password@mongodb-service:27017/todo_db?authSource=admin
        ---
        apiVersion: v1
        kind: Service
        metadata:
        name: backend-service
        namespace: todo
        spec:
        selector:
            app: backend
        ports:
        - protocol: TCP
            port: 3001
            targetPort: 3001
        type: ClusterIP


    ```

6. FYR: `dbConfig.js` backend file. 

    ```
    // dbConfig.js

    import mongoose from 'mongoose';

    // Connection function
    export async function connect() {
        try {
            //"mongodb://root:password@mongodb-container:27017/todo_db?authSource=admin"   --> for mongodb-container
            // await mongoose.connect("mongodb://root:password@mongodb-service:27017/todo_db?authSource=admin", {
            await mongoose.connect("mongodb://root:password@mongodb-service:27017/todo_db?authSource=admin", {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log("DB Connected >>>");
        } catch (err) {
            console.error("Error connecting to DB: ", err);
            process.exit(1); // Exit the process in case of connection failure
        }
    }

    // Invoke the connect function
    connect();


    ```

7. Backend deployment is almost done. Now we need to create frontend and ingress. Then in ingress we need to create a routing for backend service. Check frontend Readme.md for further process.  `Frontend Repo URL :  https://github.com/snaveenkpndevops/Mean_Stack_Todo_App_Frontend`
