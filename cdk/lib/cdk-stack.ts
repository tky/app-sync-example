import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Table, AttributeType } from "aws-cdk-lib/aws-dynamodb";
import {
  AuthorizationType,
  Directive,
  GraphqlApi,
  Field,
  GraphqlType,
  InputType,
  MappingTemplate,
  ObjectType,
  PrimaryKey,
  Values,
  ResolvableField,
  Schema,
} from "@aws-cdk/aws-appsync-alpha";
import { RemovalPolicy } from "aws-cdk-lib";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const typeUser = new ObjectType("User", {
      definition: {
        id: GraphqlType.string({ isRequired: true }),
        name: GraphqlType.string({ isRequired: true }),
        age: GraphqlType.int({ isRequired: false }),
      },
    });

    const typeUserInput = new InputType("UserInput", {
      definition: {
        name: GraphqlType.string({ isRequired: true }),
        age: GraphqlType.int({ isRequired: false }),
      },
    });

    const schema = new Schema();
    schema.addType(typeUser);
    schema.addType(typeUserInput);

    const api = new GraphqlApi(this, "api", {
      name: "app-sync-example-api",
      schema,
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.API_KEY,
        },
      },
      xrayEnabled: false,
    });

    const table = new Table(this, "table", {
      tableName: "app-sync-example-table",
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const dataSource = api.addDynamoDbDataSource("data_source", table);

    schema.addQuery(
      "getUser",
      new ResolvableField({
        returnType: typeUser.attribute(),
        args: {
          id: GraphqlType.id({ isRequired: true }),
        },
        dataSource,
        requestMappingTemplate: MappingTemplate.dynamoDbGetItem("id", "id"),
        responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
      })
    );

    schema.addMutation(
      "addUser",
      new ResolvableField({
        returnType: typeUser.attribute(),
        args: {
          id: GraphqlType.string({ isRequired: true }),
          input: typeUserInput.attribute({ isRequired: true }),
        },
        dataSource,
        requestMappingTemplate: MappingTemplate.dynamoDbPutItem(
          PrimaryKey.partition("id").is("id"),
          Values.projecting("input")
        ),
        responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
      })
    );

    schema.addSubscription(
      "updatedUser",
      new Field({
        returnType: typeUser.attribute(),
        args: { id: GraphqlType.id({ isRequired: true }) },
        directives: [Directive.subscribe("addUser")],
      })
    );
  }
}
