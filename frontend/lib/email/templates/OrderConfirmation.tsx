import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Hr,
    Column,
    Row,
    Link,
} from '@react-email/components';

interface OrderConfirmationEmailProps {
    orderId: string;
    customerName: string;
    orderTotal: string;
    shippingAddress: {
        line1: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
    items: Array<{
        name: string;
        quantity: number;
        price: string;
        image_url?: string;
    }>;
}

export const OrderConfirmationEmail = ({
    orderId,
    customerName,
    orderTotal,
    shippingAddress,
    items,
}: OrderConfirmationEmailProps) => (
    <Html>
        <Head />
        <Preview>Your Carto-Art order #{orderId} has been confirmed!</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={logoContainer}>
                    <Text style={logo}>Carto-Art</Text>
                </Section>
                <Heading style={h1}>Order Confirmed</Heading>
                <Text style={text}>
                    Hi {customerName},
                </Text>
                <Text style={text}>
                    Thank you for your order! We've received it and are getting it ready to be printed and shipped.
                </Text>

                <Section style={orderInfo}>
                    <Text style={orderIdText}>Order ID: <span style={{ fontWeight: 'bold' }}>#{orderId}</span></Text>
                </Section>

                <Hr style={hr} />

                <Section style={itemsContainer}>
                    {items.map((item, i) => (
                        <Row key={i} style={itemRow}>
                            <Column style={{ width: '60px' }}>
                                {item.image_url && (
                                    <Img src={item.image_url} width="50" height="50" style={itemImage} alt={item.name} />
                                )}
                            </Column>
                            <Column>
                                <Text style={itemTitle}>{item.name}</Text>
                                <Text style={itemSub}>Qty: {item.quantity}</Text>
                            </Column>
                            <Column style={{ textAlign: 'right' as const }}>
                                <Text style={itemPrice}>{item.price}</Text>
                            </Column>
                        </Row>
                    ))}
                </Section>

                <Hr style={hr} />

                <Section style={totalContainer}>
                    <Row>
                        <Column>
                            <Text style={totalLabel}>Total</Text>
                        </Column>
                        <Column style={{ textAlign: 'right' as const }}>
                            <Text style={totalText}>{orderTotal}</Text>
                        </Column>
                    </Row>
                </Section>

                <Section style={shippingSection}>
                    <Heading as="h3" style={h3}>Shipping To</Heading>
                    <Text style={addressText}>
                        {shippingAddress.line1}<br />
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}<br />
                        {shippingAddress.country}
                    </Text>
                </Section>

                <Hr style={hr} />

                <Text style={footer}>
                    If you have any questions, simply reply to this email or contact us at <Link href="mailto:support@cartoart.net">support@cartoart.net</Link>.
                </Text>
                <Text style={footerTiny}>
                    © {new Date().getFullYear()} Carto-Art. All rights reserved.
                </Text>
            </Container>
        </Body>
    </Html>
);

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const logoContainer = {
    textAlign: 'center' as const,
    marginBottom: '20px',
};

const logo = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: '-0.5px',
};

const h1 = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 16px',
    textAlign: 'center' as const,
};

const h3 = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 8px',
};

const text = {
    fontSize: '16px',
    color: '#525f7f',
    lineHeight: '24px',
    margin: '0 0 16px',
};

const orderInfo = {
    textAlign: 'center' as const,
    marginBottom: '24px',
};

const orderIdText = {
    fontSize: '14px',
    color: '#8898aa',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
};

const itemsContainer = {
    margin: '20px 0',
};

const itemRow = {
    marginBottom: '10px',
};

const itemImage = {
    borderRadius: '4px',
    objectFit: 'cover' as const,
};

const itemTitle = {
    fontSize: '15px',
    fontWeight: '500',
    color: '#333',
    margin: '0',
};

const itemSub = {
    fontSize: '13px',
    color: '#8898aa',
    margin: '4px 0 0',
};

const itemPrice = {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    margin: '0',
};

const totalContainer = {
    margin: '20px 0',
};

const totalLabel = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
};

const totalText = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#000',
};

const shippingSection = {
    backgroundColor: '#f6f9fc',
    padding: '20px',
    borderRadius: '4px',
};

const addressText = {
    fontSize: '14px',
    color: '#525f7f',
    lineHeight: '20px',
    margin: '0',
};

const footer = {
    fontSize: '14px',
    color: '#8898aa',
    textAlign: 'center' as const,
    marginTop: '32px',
};

const footerTiny = {
    fontSize: '12px',
    color: '#adb5bd',
    textAlign: 'center' as const,
    marginTop: '12px',
};
